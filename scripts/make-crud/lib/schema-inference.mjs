import {
  ENUM_HINT_SUFFIXES,
  FILE_TOKEN,
  toKebab,
  toSingularKebab,
} from "./string-utils.mjs";
import {
  findResponsePayload,
  unwrapItemPayload,
  unwrapListPayload,
} from "./payload-utils.mjs";

export const inferEntitySample = ({
  listRequest,
  detailRequest,
  createRequest,
  updateRequest,
  payloadSample,
}) => {
  const detailPayload = unwrapItemPayload(findResponsePayload(detailRequest));
  if (
    detailPayload &&
    typeof detailPayload === "object" &&
    !Array.isArray(detailPayload)
  ) {
    return detailPayload;
  }

  const listPayload = unwrapListPayload(findResponsePayload(listRequest));
  if (
    Array.isArray(listPayload) &&
    listPayload[0] &&
    typeof listPayload[0] === "object"
  ) {
    return listPayload[0];
  }

  const createPayload = unwrapItemPayload(findResponsePayload(createRequest));
  if (
    createPayload &&
    typeof createPayload === "object" &&
    !Array.isArray(createPayload)
  ) {
    return createPayload;
  }

  const updatePayload = unwrapItemPayload(findResponsePayload(updateRequest));
  if (
    updatePayload &&
    typeof updatePayload === "object" &&
    !Array.isArray(updatePayload)
  ) {
    return updatePayload;
  }

  if (
    payloadSample &&
    typeof payloadSample === "object" &&
    !Array.isArray(payloadSample)
  ) {
    return payloadSample;
  }

  return { id: "" };
};

export const inferNode = (value, required = true) => {
  if (value === FILE_TOKEN) {
    return { kind: "file", required };
  }

  if (Array.isArray(value)) {
    return {
      kind: "array",
      required,
      item:
        value.length > 0
          ? inferNode(value[0], true)
          : { kind: "unknown", required: true },
    };
  }

  if (value === null) {
    return { kind: "null", required };
  }

  if (typeof value === "object") {
    const properties = {};
    for (const [key, entryValue] of Object.entries(value)) {
      properties[key] = inferNode(entryValue, true);
    }

    return {
      kind: "object",
      required,
      properties,
    };
  }

  if (typeof value === "number") {
    return { kind: "number", required };
  }

  if (typeof value === "boolean") {
    return { kind: "boolean", required };
  }

  return { kind: "string", required };
};

export const inferTreeFromPayload = (payloadSample) => {
  if (
    !payloadSample ||
    typeof payloadSample !== "object" ||
    Array.isArray(payloadSample)
  ) {
    return { kind: "object", required: true, properties: {} };
  }

  return inferNode(payloadSample, true);
};

export const applyOptional = (schema, required) =>
  required ? schema : `${schema}.optional()`;

export const nodeToZod = (node) => {
  switch (node.kind) {
    case "string":
      return applyOptional("z.string().min(1)", node.required);
    case "number":
      return applyOptional("z.coerce.number()", node.required);
    case "boolean":
      return applyOptional("z.boolean()", node.required);
    case "file": {
      const fileBase = `z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File)`;
      return applyOptional(fileBase, node.required);
    }
    case "array":
      return applyOptional(`z.array(${nodeToZod(node.item)})`, node.required);
    case "null":
      return applyOptional("z.null()", node.required);
    case "object": {
      const entries = Object.entries(node.properties);
      const lines = entries.map(
        ([key, child]) => `  ${key}: ${nodeToZod(child)},`,
      );
      const objectSchema = `z.object({\n${lines.join("\n")}\n})`;
      return applyOptional(objectSchema, node.required);
    }
    default:
      return applyOptional("z.any()", node.required);
  }
};

export const nodeToDefaultValueCode = (node) => {
  switch (node.kind) {
    case "string":
      return "''";
    case "number":
      return "0";
    case "boolean":
      return "false";
    case "file":
      return "undefined as unknown as File";
    case "array":
      return "[]";
    case "null":
      return "null";
    case "object": {
      const properties = Object.entries(node.properties);
      if (properties.length === 0) {
        return "{}";
      }

      const lines = properties.map(
        ([key, child]) => `  ${key}: ${nodeToDefaultValueCode(child)},`,
      );
      return `{\n${lines.join("\n")}\n}`;
    }
    default:
      return "undefined";
  }
};

export const sampleToTsType = (value, depth = 0) => {
  const indent = "  ".repeat(depth);
  const nextIndent = "  ".repeat(depth + 1);

  if (value === null) {
    return "null";
  }

  if (value === FILE_TOKEN) {
    return "File";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "unknown[]";
    }

    return `${sampleToTsType(value[0], depth)}[]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "Record<string, unknown>";
    }

    const lines = entries.map(
      ([key, entryValue]) =>
        `${nextIndent}${key}: ${sampleToTsType(entryValue, depth + 1)}`,
    );
    return `{\n${lines.join("\n")}\n${indent}}`;
  }

  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  return "unknown";
};

export const flattenEditableLeaves = (node, prefix = []) => {
  if (node.kind === "object") {
    return Object.entries(node.properties).flatMap(([key, child]) =>
      flattenEditableLeaves(child, [...prefix, key]),
    );
  }

  if (node.kind === "unknown" || node.kind === "null") {
    return [];
  }

  if (prefix.length === 0) {
    return [];
  }

  const label = prefix
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return [
    {
      path: prefix.join("."),
      label,
      kind: node.kind,
      required: node.required,
    },
  ];
};

export const collectLeafValuesByPath = (
  value,
  prefix = [],
  bucket = new Map(),
) => {
  if (value === null || value === undefined) {
    return bucket;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectLeafValuesByPath(entry, prefix, bucket);
    }
    return bucket;
  }

  if (typeof value === "object") {
    for (const [key, nextValue] of Object.entries(value)) {
      collectLeafValuesByPath(nextValue, [...prefix, key], bucket);
    }
    return bucket;
  }

  if (!prefix.length) {
    return bucket;
  }

  const pathKey = prefix.join(".");
  if (!bucket.has(pathKey)) {
    bucket.set(pathKey, new Set());
  }

  bucket.get(pathKey).add(value);
  return bucket;
};

export const normalizeRelationResourceKey = (fieldPath) => {
  const leafKey = fieldPath.split(".").pop() ?? fieldPath;
  const fromSnake = leafKey.match(/^(.+)_id$/i)?.[1];
  if (fromSnake) {
    return toKebab(fromSnake);
  }

  const fromCamel = leafKey.match(/^(.+)Id$/)?.[1];
  if (fromCamel) {
    return toKebab(fromCamel);
  }

  return "";
};

export const findBestRelationEndpoint = (
  relationKey,
  endpointOptions,
  currentEndpoint,
) => {
  if (!relationKey) {
    return "";
  }

  const normalizedRelation = toKebab(relationKey);
  const candidates = endpointOptions
    .filter((option) => option.endpoint !== currentEndpoint)
    .filter((option) => {
      const endpoint = option.endpoint;
      const singularEndpoint = toSingularKebab(endpoint);
      const pluralRelation = normalizedRelation.endsWith("s")
        ? normalizedRelation
        : normalizedRelation.endsWith("y")
          ? `${normalizedRelation.slice(0, -1)}ies`
          : `${normalizedRelation}s`;

      return (
        endpoint === normalizedRelation ||
        singularEndpoint === normalizedRelation ||
        endpoint === pluralRelation ||
        singularEndpoint === toSingularKebab(normalizedRelation)
      );
    });

  if (!candidates.length) {
    return "";
  }

  return candidates[0]?.candidate?.basePath ?? "";
};

export const inferFormFieldMetadata = ({
  formFields,
  payloadSamples,
  endpointOptions,
  currentEndpoint,
}) => {
  const pathValues = new Map();
  for (const sample of payloadSamples) {
    collectLeafValuesByPath(sample, [], pathValues);
  }

  return formFields.map((field) => {
    const values = Array.from(pathValues.get(field.path) ?? []);
    const stringValues = values
      .filter((entry) => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const enumValues = Array.from(new Set(stringValues));
    const leafKey = field.path.split(".").pop() ?? field.path;
    const normalizedLeaf = toKebab(leafKey);
    const relationResource = normalizeRelationResourceKey(field.path);

    const isRelationField =
      relationResource && (field.kind === "number" || field.kind === "string");

    const enumHintByName = ENUM_HINT_SUFFIXES.has(normalizedLeaf);
    const enumHintByValues = enumValues.length > 1 && enumValues.length <= 10;
    const isEnumField =
      field.kind === "string" && (enumHintByName || enumHintByValues);

    if (isRelationField) {
      const relationEndpoint = findBestRelationEndpoint(
        relationResource,
        endpointOptions,
        currentEndpoint,
      );

      return {
        ...field,
        inputKind: "relation-select",
        relationResource,
        relationEndpoint,
        enumValues: [],
      };
    }

    if (isEnumField) {
      return {
        ...field,
        inputKind: "enum-select",
        enumValues,
        relationResource: "",
        relationEndpoint: "",
      };
    }

    return {
      ...field,
      inputKind: "input",
      enumValues: [],
      relationResource: "",
      relationEndpoint: "",
    };
  });
};
