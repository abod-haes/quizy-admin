import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  API_ENDPOINTS_FILE,
  APP_ROUTE_FILE,
  PERMISSIONS_FILE,
  COLLECTION_FILE,
  CRUD_LOCALE_AR_DIR,
  CRUD_LOCALE_EN_DIR,
  ROUTES_FILE,
  SIDEBAR_DATA_FILE,
  SIDEBAR_LOCALE_AR_FILE,
  SIDEBAR_LOCALE_EN_FILE,
} from "./make-crud/lib/paths.mjs";
import {
  upsertSidebarLocaleKey,
  upsertTranslationKeysFile,
} from "./make-crud/lib/locale-upserts.mjs";
import { upsertCrudRelationEndpoints } from "./make-crud/lib/relations-upserts.mjs";

const rl = createInterface({ input, output });

const NON_CRUD_SUFFIXES = new Set([
  "reorder",
  "status",
  "attach",
  "detach",
  "replace",
]);
const IGNORED_PATH_SEGMENTS = new Set(["api", "v1", "admin"]);
const FILE_TOKEN = "__POSTMAN_FILE__";
const ENUM_HINT_SUFFIXES = new Set([
  "status",
  "type",
  "category",
  "kind",
  "mode",
  "level",
  "role",
  "lang",
]);

const toKebab = (value) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();

const toPascal = (value) =>
  toKebab(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toCamel = (value) => {
  const pascal = toPascal(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const toTitle = (value) =>
  toKebab(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toSingularKebab = (value) => {
  const normalized = toKebab(value);

  if (normalized.endsWith("ies") && normalized.length > 3) {
    return `${normalized.slice(0, -3)}y`;
  }

  if (
    (normalized.endsWith("sses") ||
      normalized.endsWith("ches") ||
      normalized.endsWith("shes") ||
      normalized.endsWith("xes") ||
      normalized.endsWith("zes")) &&
    normalized.length > 2
  ) {
    return normalized.slice(0, -2);
  }

  if (
    normalized.endsWith("s") &&
    !normalized.endsWith("ss") &&
    normalized.length > 1
  ) {
    return normalized.slice(0, -1);
  }

  return normalized;
};

const sanitizeKeySegment = (value) =>
  toCamel(String(value).replace(/[^a-zA-Z0-9_\-]/g, "-"));
const isDateFieldKey = (value) => {
  const normalized = String(value ?? "");
  return (
    /(^|_)(created|updated|deleted)_at$/i.test(normalized) ||
    /(^|_)(date|datetime|timestamp)$/i.test(normalized) ||
    /At$/.test(normalized)
  );
};

const prompt = async (message) => {
  const answer = await rl.question(message);
  return answer.trim();
};

const toIdentifier = (value, fallback = "id") => {
  const cleaned = toCamel(String(value ?? "").replace(/[^a-zA-Z0-9_$]/g, ""));
  if (!cleaned || /^[0-9]/.test(cleaned)) {
    return fallback;
  }

  return cleaned;
};

const parseDynamicSegmentName = (segment) => {
  if (!isDynamicSegment(segment)) {
    return null;
  }

  const fromDoubleBraces = segment.match(/^\{\{(.+)\}\}$/)?.[1];
  if (fromDoubleBraces) {
    return toIdentifier(fromDoubleBraces, "id");
  }

  const fromBraces = segment.match(/^\{(.+)\}$/)?.[1];
  if (fromBraces) {
    return toIdentifier(fromBraces, "id");
  }

  if (segment.startsWith(":")) {
    return toIdentifier(segment.slice(1), "id");
  }

  return "id";
};

const isDynamicSegment = (segment) => {
  if (!segment) {
    return false;
  }

  return (
    /^\{\{.+\}\}$/.test(segment) ||
    /^\{.+\}$/.test(segment) ||
    /^:.+/.test(segment)
  );
};

const normalizePathSegments = (pathValue) => {
  const rawSegments = (Array.isArray(pathValue) ? pathValue : [])
    .map((segment) => {
      if (typeof segment === "string") {
        return segment;
      }

      if (segment && typeof segment === "object") {
        const record = segment;
        if (typeof record.value === "string") return record.value;
        if (typeof record.key === "string") return record.key;
      }

      return "";
    })
    .map((segment) => segment.trim())
    .filter(Boolean);

  const normalizedSegments = rawSegments.map((segment) => {
    const dynamicName = parseDynamicSegmentName(segment);
    return dynamicName ? `:${dynamicName}` : segment;
  });

  return {
    rawSegments,
    normalizedSegments,
    rawPath: "/" + rawSegments.join("/"),
    normalizedPath: "/" + normalizedSegments.join("/"),
  };
};

const flattenCollectionItems = (items, bucket = [], folderPath = []) => {
  for (const item of items ?? []) {
    if (Array.isArray(item?.item)) {
      const nextFolderPath = item?.name
        ? [...folderPath, String(item.name)]
        : folderPath;
      flattenCollectionItems(item.item, bucket, nextFolderPath);
      continue;
    }

    if (!item?.request) {
      continue;
    }

    const method = String(item.request.method ?? "").toUpperCase();
    const pathInfo = normalizePathSegments(item.request.url?.path);

    if (!method || pathInfo.rawSegments.length === 0) {
      continue;
    }

    bucket.push({
      name: item.name ?? "",
      folderPath,
      method,
      request: item.request,
      responses: Array.isArray(item.response) ? item.response : [],
      ...pathInfo,
    });
  }

  return bucket;
};

const hasFolderPrefix = (folderPath, prefix) =>
  prefix.every((entry, index) => folderPath[index] === entry);

const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parsePrimitive = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed.toLowerCase() === "true") {
    return true;
  }

  if (trimmed.toLowerCase() === "false") {
    return false;
  }

  if (trimmed.toLowerCase() === "null") {
    return null;
  }

  const parsedJson = parseJsonSafely(trimmed);
  if (parsedJson !== null) {
    return parsedJson;
  }

  return trimmed;
};

const parseBracketPath = (key) => {
  const segments = [];
  const source = String(key ?? "").trim();

  if (!source) {
    return segments;
  }

  const firstMatch = source.match(/^([^\[]+)/);
  if (firstMatch?.[1]) {
    segments.push(sanitizeKeySegment(firstMatch[1]));
  }

  const bracketMatches = source.matchAll(/\[([^\]]*)\]/g);
  for (const match of bracketMatches) {
    const value = match[1];
    if (!value) {
      continue;
    }

    const normalized = sanitizeKeySegment(value);
    if (normalized) {
      segments.push(normalized);
    }
  }

  return segments.filter(Boolean);
};

const setDeepValue = (target, pathSegments, value) => {
  if (!pathSegments.length) {
    return;
  }

  let cursor = target;
  for (let index = 0; index < pathSegments.length; index += 1) {
    const segment = pathSegments[index];
    const isLeaf = index === pathSegments.length - 1;

    if (isLeaf) {
      cursor[segment] = value;
      return;
    }

    const nextValue = cursor[segment];
    if (
      !nextValue ||
      typeof nextValue !== "object" ||
      Array.isArray(nextValue)
    ) {
      cursor[segment] = {};
    }

    cursor = cursor[segment];
  }
};

const findResponsePayload = (requestItem) => {
  if (!requestItem) {
    return null;
  }

  for (const response of requestItem.responses) {
    if (typeof response?.body !== "string") {
      continue;
    }

    const parsed = parseJsonSafely(response.body);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
};

const unwrapListPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

const unwrapItemPayload = (payload) => {
  if (
    payload &&
    typeof payload === "object" &&
    payload.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }

  return payload;
};

const inferEntitySample = ({
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

const inferNode = (value, required = true, nullable = false) => {
  if (value === FILE_TOKEN) {
    return { kind: "file", required, nullable };
  }

  if (Array.isArray(value)) {
    return {
      kind: "array",
      required,
      nullable,
      item:
        value.length > 0
          ? inferNode(value[0], true, false)
          : { kind: "unknown", required: true, nullable: false },
    };
  }

  if (value === null) {
    return { kind: "unknown", required, nullable: true };
  }

  if (typeof value === "object") {
    const properties = {};
    for (const [key, entryValue] of Object.entries(value)) {
      properties[key] = inferNode(entryValue, true, false);
    }

    return {
      kind: "object",
      required,
      nullable,
      properties,
    };
  }

  if (typeof value === "number") {
    return { kind: "number", required, nullable };
  }

  if (typeof value === "boolean") {
    return { kind: "boolean", required, nullable };
  }

  return { kind: "string", required, nullable };
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const inferMergedNode = (values, requiredSource, required = true) => {
  const presentValues = values.filter((value) => value !== undefined);
  const hasNull = presentValues.some((value) => value === null);
  const nonNullValues = presentValues.filter((value) => value !== null);

  if (!nonNullValues.length) {
    return { kind: "unknown", required, nullable: hasNull };
  }

  const sample = nonNullValues[0];

  if (sample === FILE_TOKEN) {
    return { kind: "file", required, nullable: hasNull };
  }

  if (Array.isArray(sample)) {
    const arrayValues = nonNullValues.filter(Array.isArray);
    const itemValues = arrayValues.flatMap((value) => value);
    const requiredItemSource = Array.isArray(requiredSource)
      ? requiredSource[0]
      : undefined;

    return {
      kind: "array",
      required,
      nullable: hasNull,
      item: itemValues.length
        ? inferMergedNode(itemValues, requiredItemSource, true)
        : { kind: "unknown", required: true, nullable: false },
    };
  }

  if (isPlainObject(sample)) {
    const objectValues = nonNullValues.filter(isPlainObject);
    const keys = new Set();
    for (const value of objectValues) {
      Object.keys(value).forEach((key) => keys.add(key));
    }

    const requiredObject = isPlainObject(requiredSource) ? requiredSource : {};
    const properties = {};
    for (const key of keys) {
      properties[key] = inferMergedNode(
        objectValues.map((value) => value[key]),
        requiredObject[key],
        Object.prototype.hasOwnProperty.call(requiredObject, key),
      );
    }

    return { kind: "object", required, nullable: hasNull, properties };
  }

  if (typeof sample === "number") {
    return { kind: "number", required, nullable: hasNull };
  }

  if (typeof sample === "boolean") {
    return { kind: "boolean", required, nullable: hasNull };
  }

  return { kind: "string", required, nullable: hasNull };
};

const inferTreeFromPayload = (payloadSample) => {
  if (
    !payloadSample ||
    typeof payloadSample !== "object" ||
    Array.isArray(payloadSample)
  ) {
    return { kind: "object", required: true, nullable: false, properties: {} };
  }

  return inferNode(payloadSample, true, false);
};

const inferTreeFromSamples = (samples, requiredSample = {}) => {
  const validSamples = samples.filter((sample) => isPlainObject(sample));
  const fallbackRequiredSample = isPlainObject(requiredSample)
    ? requiredSample
    : {};

  if (!validSamples.length && !Object.keys(fallbackRequiredSample).length) {
    return { kind: "object", required: true, nullable: false, properties: {} };
  }

  return inferMergedNode(
    validSamples.length ? validSamples : [fallbackRequiredSample],
    fallbackRequiredSample,
    true,
  );
};

const applyModifiers = (schema, node) => {
  let next = schema;
  if (node.nullable) {
    next = `${next}.nullable()`;
  }
  if (!node.required) {
    next = `${next}.optional()`;
  }

  return next;
};

const nodeToZod = (node) => {
  switch (node.kind) {
    case "string":
      return applyModifiers("z.string().min(1)", node);
    case "number":
      return applyModifiers("z.coerce.number()", node);
    case "boolean":
      return applyModifiers("z.boolean()", node);
    case "file": {
      const fileBase = `z.custom<File>((value) => typeof File !== 'undefined' && value instanceof File)`;
      return applyModifiers(fileBase, node);
    }
    case "array":
      return applyModifiers(
        `z.array(${nodeToZod({ ...node.item, required: true })})`,
        node,
      );
    case "null":
      return applyModifiers("z.null()", node);
    case "object": {
      const entries = Object.entries(node.properties);
      const lines = entries.map(
        ([key, child]) => `  ${key}: ${nodeToZod(child)},`,
      );
      const objectSchema = `z.object({\n${lines.join("\n")}\n})`;
      return applyModifiers(objectSchema, node);
    }
    default:
      return applyModifiers("z.any()", node);
  }
};

const nodeToDefaultValueCode = (node) => {
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

const sampleToTsType = (value, depth = 0) => {
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

const flattenPrimitiveLeaves = (node, prefix = []) => {
  if (node.kind === "object") {
    return Object.entries(node.properties).flatMap(([key, child]) =>
      flattenPrimitiveLeaves(child, [...prefix, key]),
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

const collectLeafValuesByPath = (value, prefix = [], bucket = new Map()) => {
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

const normalizeRelationResourceKey = (fieldPath) => {
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

const findBestRelationEndpoint = (
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

const inferFormFieldMetadata = ({
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

const pickBestCandidate = (requests, endpointSegment) => {
  const candidates = new Map();

  for (const request of requests) {
    const segmentIndex = request.normalizedSegments.findIndex(
      (segment) => toKebab(segment) === endpointSegment,
    );

    if (segmentIndex === -1) {
      continue;
    }

    const remainder = request.normalizedSegments.slice(segmentIndex + 1);
    if (remainder.some((segment) => NON_CRUD_SUFFIXES.has(toKebab(segment)))) {
      continue;
    }

    const baseSegments = request.normalizedSegments.slice(0, segmentIndex + 1);
    const basePath = "/" + baseSegments.join("/");

    if (!candidates.has(basePath)) {
      candidates.set(basePath, {
        basePath,
        endpointSegment,
        requests: [],
      });
    }

    candidates.get(basePath).requests.push(request);
  }

  let best = null;

  for (const candidate of candidates.values()) {
    const findRequest = (method, normalizedPath) =>
      candidate.requests.find(
        (entry) =>
          entry.method === method && entry.normalizedPath === normalizedPath,
      );

    const detailPathCandidates = Array.from(
      new Set(
        candidate.requests
          .filter((entry) =>
            entry.normalizedPath.startsWith(`${candidate.basePath}/:`),
          )
          .map((entry) => entry.normalizedPath)
          .filter((entryPath) => {
            const tail = entryPath.slice(candidate.basePath.length + 1);
            return tail.startsWith(":") && !tail.includes("/");
          }),
      ),
    );

    const listRequest = findRequest("GET", candidate.basePath);
    const createRequest = findRequest("POST", candidate.basePath);

    const summaryByDetailPath = detailPathCandidates.map((detailPath) => {
      const detailRequest = findRequest("GET", detailPath);
      const patchRequest = findRequest("PATCH", detailPath);
      const putRequest = findRequest("PUT", detailPath);
      const removeRequest = findRequest("DELETE", detailPath);
      const updateRequest = patchRequest ?? putRequest ?? null;
      const operationsCount = [
        listRequest,
        detailRequest,
        createRequest,
        updateRequest,
        removeRequest,
      ].filter(Boolean).length;

      return {
        detailPath,
        detailRequest,
        updateRequest,
        removeRequest,
        operationsCount,
      };
    });

    const bestDetailSummary = summaryByDetailPath.sort(
      (a, b) => b.operationsCount - a.operationsCount,
    )[0];
    const detailPath =
      bestDetailSummary?.detailPath ?? `${candidate.basePath}/:id`;
    const detailRequest =
      bestDetailSummary?.detailRequest ?? findRequest("GET", detailPath);
    const updateRequest =
      bestDetailSummary?.updateRequest ??
      findRequest("PATCH", detailPath) ??
      findRequest("PUT", detailPath) ??
      null;
    const removeRequest =
      bestDetailSummary?.removeRequest ?? findRequest("DELETE", detailPath);

    const operationsCount = [
      listRequest,
      detailRequest,
      createRequest,
      updateRequest,
      removeRequest,
    ].filter(Boolean).length;

    if (operationsCount === 0) {
      continue;
    }

    const score = operationsCount * 10 + candidate.basePath.length;

    const summary = {
      basePath: candidate.basePath,
      detailPath,
      listRequest,
      detailRequest,
      createRequest,
      updateRequest,
      removeRequest,
      score,
    };

    if (!best || summary.score > best.score) {
      best = summary;
    }
  }

  return best;
};

const extractPayloadSample = (requestItem) => {
  const mode = requestItem?.request?.body?.mode;
  if (!mode) {
    return null;
  }

  if (mode === "raw") {
    const rawBody = requestItem.request.body?.raw;
    if (typeof rawBody !== "string") {
      return null;
    }

    const parsed = parseJsonSafely(rawBody);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }

    return null;
  }

  if (mode === "formdata" || mode === "urlencoded") {
    const entries = requestItem.request.body?.[mode];
    if (!Array.isArray(entries)) {
      return null;
    }

    const root = {};
    for (const entry of entries) {
      if (!entry || typeof entry.key !== "string" || entry.disabled) {
        continue;
      }

      const pathSegments = parseBracketPath(entry.key);
      if (!pathSegments.length) {
        continue;
      }

      const rawValue =
        entry.type === "file" ? FILE_TOKEN : parsePrimitive(entry.value ?? "");
      setDeepValue(root, pathSegments, rawValue);
    }

    return root;
  }

  return null;
};

const getSuggestions = (requests, endpointSegment) => {
  const resources = new Set();

  for (const request of requests) {
    for (const segment of request.normalizedSegments) {
      const normalized = toKebab(segment);
      if (
        !normalized ||
        normalized === "api" ||
        normalized === "v1" ||
        normalized === "admin"
      ) {
        continue;
      }

      if (normalized.startsWith("{{") || normalized === ":id") {
        continue;
      }

      resources.add(normalized);
    }
  }

  return Array.from(resources)
    .filter(
      (entry) =>
        entry.includes(endpointSegment) || endpointSegment.includes(entry),
    )
    .slice(0, 8);
};

const collectEndpointOptions = (requests) => {
  const segments = new Set();

  for (const request of requests) {
    for (const segment of request.normalizedSegments) {
      if (segment.startsWith(":")) {
        continue;
      }

      const normalized = toKebab(segment);
      if (
        !normalized ||
        IGNORED_PATH_SEGMENTS.has(normalized) ||
        NON_CRUD_SUFFIXES.has(normalized)
      ) {
        continue;
      }

      segments.add(normalized);
    }
  }

  const options = [];
  for (const segment of segments) {
    const candidate = pickBestCandidate(requests, segment);
    if (!candidate) {
      continue;
    }

    const ops = [
      candidate.listRequest ? "get" : null,
      candidate.detailRequest
        ? candidate.detailPath.split("/").pop()?.toLowerCase().includes("slug")
          ? "getBySlug"
          : "getById"
        : null,
      candidate.createRequest ? "post" : null,
      candidate.updateRequest
        ? candidate.updateRequest.method.toLowerCase()
        : null,
      candidate.removeRequest ? "delete" : null,
    ].filter(Boolean);

    if (ops.length === 0) {
      continue;
    }

    options.push({
      endpoint: segment,
      ops,
      candidate,
    });
  }

  return options.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
};

const findRequestPathBySuffix = (requests, method, pathSuffix) => {
  const normalizedMethod = String(method ?? "").toUpperCase();
  const normalizedSuffix = String(pathSuffix ?? "");

  const matched = requests.find(
    (request) =>
      request.method === normalizedMethod &&
      typeof request.normalizedPath === "string" &&
      request.normalizedPath.endsWith(normalizedSuffix),
  );

  return matched?.normalizedPath ?? null;
};

const normalizeLabel = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getTopLevelApiGroups = (requests) => {
  const groups = new Set();

  for (const request of requests) {
    const firstFolder = request.folderPath?.[0];
    if (firstFolder) {
      groups.add(String(firstFolder));
    }
  }

  return Array.from(groups).sort((a, b) => a.localeCompare(b));
};

const getChildFolders = (requests, currentScope) => {
  const childSet = new Set();

  for (const request of requests) {
    if (!hasFolderPrefix(request.folderPath ?? [], currentScope)) {
      continue;
    }

    const nextIndex = currentScope.length;
    const nextFolder = request.folderPath?.[nextIndex];
    if (nextFolder) {
      childSet.add(String(nextFolder));
    }
  }

  return Array.from(childSet).sort((a, b) => a.localeCompare(b));
};

const parseOperationSelection = (input, availableOps) => {
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput || normalizedInput === "all") {
    return new Set(availableOps);
  }

  const aliasToOperation = {
    get: "list",
    list: "list",
    post: "create",
    create: "create",
    update: "update",
    patch: "update",
    put: "update",
    delete: "remove",
    remove: "remove",
    detail: "detail",
    getbyid: "detail",
    getbyparam: "detail",
    getbyslug: "detail",
    "get-by-id": "detail",
    "get-by-slug": "detail",
    "get/id": "detail",
    "get/slug": "detail",
  };

  const tokens = normalizedInput
    .split(/[,|]/)
    .map((token) => token.trim().replace(/\s+/g, ""))
    .filter(Boolean);

  const selected = new Set();
  for (const token of tokens) {
    const numericIndex = Number(token);
    if (
      Number.isInteger(numericIndex) &&
      numericIndex >= 1 &&
      numericIndex <= availableOps.length
    ) {
      selected.add(availableOps[numericIndex - 1]);
      continue;
    }

    const mapped = aliasToOperation[token];
    if (mapped) {
      selected.add(mapped);
    }
  }

  return new Set(
    Array.from(selected).filter((op) => availableOps.includes(op)),
  );
};

const ensureDirectories = (baseDir, includeForm, includeView) => {
  const dirs = [
    "pages",
    "services",
    "hooks",
    "types",
    "components",
    "queries",
    "validations",
  ];

  if (includeForm) {
    dirs.push(path.join("pages", "form"));
  }

  if (includeView) {
    dirs.push(path.join("pages", "view"));
  }

  for (const dir of dirs) {
    fs.mkdirSync(path.join(baseDir, dir), { recursive: true });
  }
};

const writeFile = (filePath, content) => {
  if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`);
    process.exit(1);
  }

  fs.writeFileSync(filePath, content);
};

const upsertApiEndpoints = (resourceCamel, paths) => {
  const defaultContent = `export const API_ENDPOINTS = {\n} as const\n`;
  const current = fs.existsSync(API_ENDPOINTS_FILE)
    ? fs.readFileSync(API_ENDPOINTS_FILE, "utf8")
    : defaultContent;

  if (current.includes(`${resourceCamel}: {`)) {
    return;
  }

  const insertAt = current.lastIndexOf("} as const");
  if (insertAt === -1) {
    console.warn(
      'Could not update API_ENDPOINTS automatically. Missing "} as const" marker.',
    );
    return;
  }

  const optionalEntries = [
    paths.reorder ? `    reorder: '${paths.reorder}',\n` : "",
    paths.addMedia ? `    addMedia: '${paths.addMedia}',\n` : "",
    paths.removeMedia ? `    removeMedia: '${paths.removeMedia}',\n` : "",
  ].join("");

  const block =
    `  ${resourceCamel}: {\n` +
    `    list: '${paths.list}',\n` +
    `    detail: '${paths.detail}',\n` +
    `    create: '${paths.create}',\n` +
    `    update: '${paths.update}',\n` +
    `    remove: '${paths.remove}',\n` +
    optionalEntries +
    `  },\n`;

  const prefix = current.slice(0, insertAt);
  const suffix = current.slice(insertAt);

  const trailingWhitespace = prefix.match(/\s*$/)?.[0] ?? "";
  let prefixCore = prefix.slice(0, prefix.length - trailingWhitespace.length);

  if (prefixCore.endsWith("}")) {
    prefixCore += ",";
  }

  const normalizedPrefix = prefixCore + trailingWhitespace;
  const needsLeadingNewline = !normalizedPrefix.endsWith("\n");
  const updated = `${normalizedPrefix}${needsLeadingNewline ? "\n" : ""}${block}${suffix}`;

  fs.writeFileSync(API_ENDPOINTS_FILE, updated);
};

const upsertCrudPermissions = (moduleKey, permissionSection) => {
  if (!fs.existsSync(PERMISSIONS_FILE)) {
    return;
  }

  const current = fs.readFileSync(PERMISSIONS_FILE, "utf8");
  const normalizedModuleKey = toCamel(moduleKey);
  const normalizedSection = toKebab(permissionSection || moduleKey);
  const constName = `${normalizedSection.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}_PERMISSIONS`;

  let next = current;

  if (!next.includes(`const ${constName} = buildCrudPermissions('${normalizedSection}')`)) {
    const exportPermissionsIndex = next.indexOf("export const PERMISSIONS = {");
    if (exportPermissionsIndex !== -1) {
      const constBlock = `const ${constName} = buildCrudPermissions('${normalizedSection}')\n\n`;
      next = next.slice(0, exportPermissionsIndex) + constBlock + next.slice(exportPermissionsIndex);
    }
  }

  const permissionsStart = next.indexOf("export const PERMISSIONS = {");
  if (permissionsStart === -1) {
    fs.writeFileSync(PERMISSIONS_FILE, next);
    return;
  }

  const permissionsEnd = next.indexOf("} as const", permissionsStart);
  if (permissionsEnd === -1) {
    fs.writeFileSync(PERMISSIONS_FILE, next);
    return;
  }

  const permissionsBlock = next.slice(permissionsStart, permissionsEnd);
  if (!permissionsBlock.includes(`${normalizedModuleKey}:`)) {
    const insertAt = permissionsEnd;
    const entry = `  ${normalizedModuleKey}: ${constName},\n`;
    next = next.slice(0, insertAt) + entry + next.slice(insertAt);
  }

  fs.writeFileSync(PERMISSIONS_FILE, next);
};

const findChildrenArrayCloseIndex = (source) => {
  const childrenIndex = source.indexOf("children: [");
  if (childrenIndex === -1) {
    return -1;
  }

  const startIndex = source.indexOf("[", childrenIndex);
  if (startIndex === -1) {
    return -1;
  }

  let depth = 0;
  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

const findArrayCloseIndex = (source, arrayOpenIndex) => {
  let depth = 0;
  for (let index = arrayOpenIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

const upsertSidebarPrimaryItem = ({
  id,
  routeKey,
  labelKey,
  includeAdd,
  includeEdit,
  includeView,
  routeParamName,
}) => {
  if (!fs.existsSync(SIDEBAR_DATA_FILE)) {
    return;
  }

  let current = fs.readFileSync(SIDEBAR_DATA_FILE, "utf8");

  if (
    current.includes(`id: '${id}'`) ||
    current.includes(`to: APP_ROUTES.${routeKey}.path`)
  ) {
    return;
  }

  if (current.includes("from 'lucide-react'")) {
    current = current.replace(
      /import\s*\{([^}]+)\}\s*from 'lucide-react'/,
      (line, importsChunk) => {
        const imports = importsChunk
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);

        if (!imports.includes("Folder")) {
          imports.push("Folder");
        }

        return `import { ${imports.join(", ")} } from 'lucide-react'`;
      },
    );
  } else {
    current = `import { Folder } from 'lucide-react'\n\n${current}`;
  }

  const appRoutesImport =
    "import { APP_ROUTES } from '@/app/router/route-object.type'";
  if (!current.includes(appRoutesImport)) {
    const importMatches = Array.from(current.matchAll(/^import .+$/gm));
    if (importMatches.length) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertAt = (lastImport.index ?? 0) + lastImport[0].length;
      current = `${current.slice(0, insertAt)}\n${appRoutesImport}${current.slice(insertAt)}`;
    } else {
      current = `${appRoutesImport}\n\n${current}`;
    }
  }

  const primaryItemsMarker =
    "export const primarySidebarItems: SidebarItem[] = [";
  const primaryItemsIndex = current.indexOf(primaryItemsMarker);
  if (primaryItemsIndex === -1) {
    fs.writeFileSync(SIDEBAR_DATA_FILE, current);
    return;
  }

  const primaryAssignmentIndex = current.indexOf("=", primaryItemsIndex);
  const primaryArrayOpenIndex = current.indexOf("[", primaryAssignmentIndex);
  const primaryArrayCloseIndex = findArrayCloseIndex(
    current,
    primaryArrayOpenIndex,
  );
  if (primaryArrayOpenIndex === -1 || primaryArrayCloseIndex === -1) {
    fs.writeFileSync(SIDEBAR_DATA_FILE, current);
    return;
  }

  const activePaths = [
    includeAdd ? `APP_ROUTES.${routeKey}.path + '/add'` : null,
    includeView
      ? `APP_ROUTES.${routeKey}.path + '/view/:${routeParamName}'`
      : null,
    includeEdit
      ? `APP_ROUTES.${routeKey}.path + '/edit/:${routeParamName}'`
      : null,
  ].filter(Boolean);

  const sidebarItemBlock =
    `  {\n` +
    `    id: '${id}',\n` +
    `    labelKey: '${labelKey}',\n` +
    `    to: APP_ROUTES.${routeKey}.path,\n` +
    `    icon: Folder,\n` +
    `    end: true,\n` +
    (activePaths.length
      ? `    activeMatch: {\n      include: [${activePaths.join(", ")}],\n    },\n`
      : "") +
    `  },\n`;

  const arrayContent = current.slice(
    primaryArrayOpenIndex + 1,
    primaryArrayCloseIndex,
  );
  const hasItems = arrayContent.trim().length > 0;
  const blockPrefix = hasItems ? "\n" : "";
  const updated =
    current.slice(0, primaryArrayCloseIndex) +
    `${blockPrefix}${sidebarItemBlock}` +
    current.slice(primaryArrayCloseIndex);

  fs.writeFileSync(SIDEBAR_DATA_FILE, updated);
};

const addRoutes = ({
  name,
  camel,
  pascal,
  includeCreate,
  includeUpdate,
  includeView,
  protectedRoutes,
  routeParamName,
}) => {
  if (!fs.existsSync(ROUTES_FILE)) {
    return;
  }

  const current = fs.readFileSync(ROUTES_FILE, "utf8");
  if (current.includes(`${camel}: {`)) {
    return;
  }

  let insertBefore = current.indexOf("notFound:");
  if (insertBefore === -1) {
    insertBefore = current.lastIndexOf("} as const");
  }

  if (insertBefore === -1) {
    return;
  }

  let routeBlock =
    `  ${camel}: {\n` +
    `    key: '${camel}',\n` +
    `    path: '/${name}',\n` +
    `    protected: ${protectedRoutes},\n` +
    `    breadcrumbKeys: [],\n` +
    `  },\n`;

  if (includeCreate) {
    routeBlock +=
      `  add${pascal}: {\n` +
      `    key: 'add${pascal}',\n` +
      `    path: '/${name}/add',\n` +
      `    protected: ${protectedRoutes},\n` +
      `    breadcrumbKeys: [],\n` +
      `  },\n`;
  }

  if (includeUpdate) {
    routeBlock +=
      `  edit${pascal}: {\n` +
      `    key: 'edit${pascal}',\n` +
      `    path: '/${name}/edit/:${routeParamName}',\n` +
      `    protected: ${protectedRoutes},\n` +
      `    breadcrumbKeys: [],\n` +
      `  },\n`;
  }

  if (includeView) {
    routeBlock +=
      `  view${pascal}: {\n` +
      `    key: 'view${pascal}',\n` +
      `    path: '/${name}/view/:${routeParamName}',\n` +
      `    protected: ${protectedRoutes},\n` +
      `    breadcrumbKeys: [],\n` +
      `  },\n`;
  }

  routeBlock += "\n";

  const updated =
    current.slice(0, insertBefore) + routeBlock + current.slice(insertBefore);
  fs.writeFileSync(ROUTES_FILE, updated);
};

const addAppRoute = ({
  name,
  camel,
  pascal,
  includeCreate,
  includeUpdate,
  includeView,
}) => {
  if (!fs.existsSync(APP_ROUTE_FILE)) {
    return;
  }

  const current = fs.readFileSync(APP_ROUTE_FILE, "utf8");
  if (current.includes(`APP_ROUTES.${camel}.path`)) {
    return;
  }

  const importLines = [
    `import ${pascal}Page from '@/modules/${name}/pages/${name}.page'`,
  ];

  if (includeCreate || includeUpdate) {
    importLines.push(
      `import ${pascal}FormPage from '@/modules/${name}/pages/form/${name}.form.page'`,
    );
  }

  if (includeView) {
    importLines.push(
      `import ${pascal}ViewPage from '@/modules/${name}/pages/view/${name}.view.page'`,
    );
  }

  let withImports = current;
  const importMatches = [...current.matchAll(/^import .*$/gm)];
  const lastImport = importMatches[importMatches.length - 1];

  if (lastImport) {
    const importInsertAt = lastImport.index + lastImport[0].length + 1;
    const newImports = importLines
      .filter((line) => !current.includes(line))
      .join("\n");

    if (newImports) {
      withImports =
        current.slice(0, importInsertAt) +
        newImports +
        "\n" +
        current.slice(importInsertAt);
    }
  }

  const hasWithRouteAccess = withImports.includes("function withRouteAccess");
  const withElement = (routeKey, componentName) =>
    hasWithRouteAccess
      ? `withRouteAccess('${routeKey}', createElement(${componentName}))`
      : `createElement(${componentName})`;

  let routeBlock =
    `      {\n` +
    `        path: APP_ROUTES.${camel}.path,\n` +
    `        element: ${withElement(camel, `${pascal}Page`)},\n` +
    `      },\n`;

  if (includeCreate) {
    routeBlock +=
      `      {\n` +
      `        path: APP_ROUTES.add${pascal}.path,\n` +
      `        element: ${withElement(`add${pascal}`, `${pascal}FormPage`)},\n` +
      `      },\n`;
  }

  if (includeUpdate) {
    routeBlock +=
      `      {\n` +
      `        path: APP_ROUTES.edit${pascal}.path,\n` +
      `        element: ${withElement(`edit${pascal}`, `${pascal}FormPage`)},\n` +
      `      },\n`;
  }

  if (includeView) {
    routeBlock +=
      `      {\n` +
      `        path: APP_ROUTES.view${pascal}.path,\n` +
      `        element: ${withElement(`view${pascal}`, `${pascal}ViewPage`)},\n` +
      `      },\n`;
  }

  const childrenCloseIndex = findChildrenArrayCloseIndex(withImports);
  if (childrenCloseIndex === -1) {
    fs.writeFileSync(APP_ROUTE_FILE, withImports);
    return;
  }

  const updated =
    withImports.slice(0, childrenCloseIndex) +
    routeBlock +
    withImports.slice(childrenCloseIndex);

  fs.writeFileSync(APP_ROUTE_FILE, updated);
};

async function main() {
  if (!fs.existsSync(COLLECTION_FILE)) {
    console.error(`Postman collection not found at ${COLLECTION_FILE}`);
    await rl.close();
    process.exit(1);
  }

  const collection = JSON.parse(fs.readFileSync(COLLECTION_FILE, "utf8"));
  const requests = flattenCollectionItems(collection.item);

  let scopePath = [];

  const topGroups = getTopLevelApiGroups(requests);
  if (topGroups.length) {
    console.log("\nAPI groups:");
    console.log("  0. all");
    topGroups.forEach((group, index) => {
      console.log(`  ${index + 1}. ${group}`);
    });

    const groupChoice = await prompt(
      "\nChoose API group (number or name) [all]: ",
    );
    if (groupChoice) {
      const groupIndex = Number(groupChoice);
      const selectedGroup =
        Number.isInteger(groupIndex) &&
        groupIndex >= 1 &&
        groupIndex <= topGroups.length
          ? topGroups[groupIndex - 1]
          : topGroups.find(
              (group) => normalizeLabel(group) === normalizeLabel(groupChoice),
            );

      if (!selectedGroup) {
        console.error(`No API group matched "${groupChoice}"`);
        await rl.close();
        process.exit(1);
      }

      scopePath = [selectedGroup];
    }
  }

  while (true) {
    const scopedRequestsForFolders = requests.filter((request) =>
      hasFolderPrefix(request.folderPath ?? [], scopePath),
    );
    const childFolders = getChildFolders(scopedRequestsForFolders, scopePath);

    if (!childFolders.length) {
      break;
    }

    console.log(
      `\nSubfolders in ${scopePath.length ? scopePath.join(" / ") : "root"}:`,
    );
    console.log("  0. stop here and show endpoints");
    childFolders.forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder}`);
    });

    const subChoice = await prompt("\nChoose subfolder (number or name) [0]: ");
    if (!subChoice || subChoice === "0") {
      break;
    }

    const subIndex = Number(subChoice);
    const selectedSubfolder =
      Number.isInteger(subIndex) &&
      subIndex >= 1 &&
      subIndex <= childFolders.length
        ? childFolders[subIndex - 1]
        : childFolders.find(
            (folder) => normalizeLabel(folder) === normalizeLabel(subChoice),
          );

    if (!selectedSubfolder) {
      console.error(`No subfolder matched "${subChoice}"`);
      await rl.close();
      process.exit(1);
    }

    scopePath = [...scopePath, selectedSubfolder];
  }

  const scopedRequests = requests.filter((request) =>
    hasFolderPrefix(request.folderPath ?? [], scopePath),
  );

  const endpointOptions = collectEndpointOptions(scopedRequests);
  const globalEndpointOptions = collectEndpointOptions(requests);
  if (!endpointOptions.length) {
    const scopeLabel = scopePath.length ? scopePath.join(" / ") : "all groups";
    console.error(`No CRUD-capable endpoints found in scope: ${scopeLabel}`);
    await rl.close();
    process.exit(1);
  }

  const scopeLabel = scopePath.length ? scopePath.join(" / ") : "all groups";
  console.log(`\nAvailable endpoints in ${scopeLabel}:`);
  endpointOptions.forEach((option, index) => {
    console.log(
      `  ${index + 1}. ${option.endpoint} (${option.ops.join(", ")})`,
    );
  });

  const endpointChoice = await prompt("\nChoose endpoint (number or name): ");
  if (!endpointChoice) {
    console.error("Endpoint selection is required");
    await rl.close();
    process.exit(1);
  }

  const selectedByIndex = Number(endpointChoice);
  const selectedOption =
    Number.isInteger(selectedByIndex) &&
    selectedByIndex >= 1 &&
    selectedByIndex <= endpointOptions.length
      ? endpointOptions[selectedByIndex - 1]
      : endpointOptions.find(
          (option) => option.endpoint === toKebab(endpointChoice),
        );

  if (!selectedOption) {
    console.error(`No endpoint matched "${endpointChoice}"`);
    await rl.close();
    process.exit(1);
  }

  const endpointSegment = selectedOption.endpoint;
  const bestCandidate = selectedOption.candidate;

  const availableOperations = [
    bestCandidate.listRequest ? "list" : null,
    bestCandidate.detailRequest ? "detail" : null,
    bestCandidate.createRequest ? "create" : null,
    bestCandidate.updateRequest ? "update" : null,
    bestCandidate.removeRequest ? "remove" : null,
  ].filter(Boolean);

  const operationLabelByKey = {
    list: "get",
    detail: "getById/getBySlug",
    create: "post",
    update: "update",
    remove: "delete",
  };

  console.log("\nAvailable operations:");
  availableOperations.forEach((operation, index) => {
    const label = operationLabelByKey[operation] ?? operation;
    console.log(`  ${index + 1}. ${label}`);
  });

  const operationsChoice = await prompt(
    `Operations (all or numbers like 1,3 or names get,post,...) [all]: `,
  );

  const selectedOperations = parseOperationSelection(
    operationsChoice,
    availableOperations,
  );
  if (!selectedOperations.size) {
    console.error("No valid operations selected for this endpoint.");
    await rl.close();
    process.exit(1);
  }

  const hasList = selectedOperations.has("list");
  const hasDetail = selectedOperations.has("detail");
  const hasCreate = selectedOperations.has("create");
  const hasUpdate = selectedOperations.has("update");
  const hasRemove = selectedOperations.has("remove");

  const routeParamName = "id";
  let detailLookupField = "id";
  if (hasDetail || hasUpdate || hasRemove) {
    const detailLookupChoice = await prompt(
      "Detail lookup field (id/slug) [id]: ",
    );
    if (detailLookupChoice.toLowerCase() === "slug") {
      detailLookupField = "slug";
    }
  }

  await rl.close();

  const name = endpointSegment;
  const pascal = toPascal(endpointSegment);
  const camel = toCamel(endpointSegment);
  const title = toTitle(endpointSegment);
  const entityPluralTitle = title;
  const entitySingularTitle = toTitle(toSingularKebab(endpointSegment));
  const entityPluralTitleLiteral = JSON.stringify(entityPluralTitle);
  const entitySingularTitleLiteral = JSON.stringify(entitySingularTitle);
  const protectedRoutes = true;

  if (!hasList && !hasCreate && !hasUpdate && !hasDetail && !hasRemove) {
    console.error(
      `Endpoint "${endpointSegment}" does not contain selected CRUD operations.`,
    );
    process.exit(1);
  }

  const payloadRequest =
    bestCandidate.createRequest ?? bestCandidate.updateRequest;
  const payloadSample = extractPayloadSample(payloadRequest);
  const createPayloadSample = extractPayloadSample(bestCandidate.createRequest);
  const updatePayloadSample = extractPayloadSample(bestCandidate.updateRequest);
  const requiredPayloadSample =
    createPayloadSample ?? updatePayloadSample ?? {};
  const payloadSamples = [
    createPayloadSample,
    updatePayloadSample,
  ]
    .filter(
      (entry) => entry && typeof entry === "object" && !Array.isArray(entry),
    )
    .map((entry) => entry);
  const payloadTree = inferTreeFromSamples(
    payloadSamples,
    requiredPayloadSample,
  );
  const payloadSchemaCode = nodeToZod(payloadTree);
  const initialStateCode = nodeToDefaultValueCode(payloadTree);
  const formFields = flattenPrimitiveLeaves(payloadTree);
  const formFieldsWithMetadata = inferFormFieldMetadata({
    formFields,
    payloadSamples,
    endpointOptions: globalEndpointOptions,
    currentEndpoint: endpointSegment,
  });

  const entitySample = inferEntitySample({
    listRequest: bestCandidate.listRequest,
    detailRequest: bestCandidate.detailRequest,
    createRequest: bestCandidate.createRequest,
    updateRequest: bestCandidate.updateRequest,
    payloadSample,
  });

  if (!("id" in entitySample)) {
    entitySample.id = "";
  }

  const entityTypeCode = sampleToTsType(entitySample);
  const entityColumnDefs = Object.keys(entitySample)
    .filter((key) => key !== "id")
    .map((key) => ({
      key,
      label: toTitle(key),
      localeKey: sanitizeKeySegment(key),
      isDate: isDateFieldKey(key),
    }));
  const entityColumns = entityColumnDefs
    .map(
      (column) =>
        `  { key: '${column.key}', labelKey: 'table.columns.${column.localeKey}', isDate: ${column.isDate} },`,
    )
    .join("\n");
  const searchDefaultsLiteral = `{
${entityColumnDefs.map((column) => `  ${JSON.stringify(column.key)}: '',`).join("\n")}
}`;
  const formFieldLocaleDefs = formFieldsWithMetadata.map((field) => ({
    ...field,
    localeKey: field.path
      .split(".")
      .map((segment) => sanitizeKeySegment(segment))
      .filter(Boolean)
      .join("_"),
  }));
  const relationFieldDefs = formFieldLocaleDefs.filter(
    (field) => field.inputKind === "relation-select",
  );
  const enumFieldDefs = formFieldLocaleDefs.filter(
    (field) => field.inputKind === "enum-select",
  );
  const relationFieldEndpointMap = Object.fromEntries(
    relationFieldDefs.map((field) => [
      field.path,
      field.relationEndpoint || "",
    ]),
  );

  const baseEndpointPath = bestCandidate.basePath;
  const detailEndpointPath = `${bestCandidate.basePath}/:${routeParamName}`;
  const reorderEndpointPath =
    findRequestPathBySuffix(
      scopedRequests,
      "PATCH",
      `${baseEndpointPath}/reorder`,
    ) ??
    findRequestPathBySuffix(
      scopedRequests,
      "PUT",
      `${baseEndpointPath}/reorder`,
    );
  const addMediaEndpointPath = findRequestPathBySuffix(
    scopedRequests,
    "POST",
    `${detailEndpointPath}/media`,
  );
  const removeMediaEndpointPath = findRequestPathBySuffix(
    scopedRequests,
    "DELETE",
    `${detailEndpointPath}/media/:mediaId`,
  );

  const endpointPaths = {
    list: baseEndpointPath,
    detail: detailEndpointPath,
    create: baseEndpointPath,
    update: detailEndpointPath,
    remove: detailEndpointPath,
    reorder: reorderEndpointPath,
    addMedia: addMediaEndpointPath,
    removeMedia: removeMediaEndpointPath,
  };
  const crudTranslationKeys = [
    "entity.singular",
    "entity.plural",
    "page.description",
    ...entityColumnDefs.map((column) => `table.columns.${column.localeKey}`),
    ...(hasCreate || hasUpdate
      ? formFieldLocaleDefs.map((field) => `form.fields.${field.localeKey}`)
      : []),
    hasDetail ? "view.title" : null,
  ].filter(Boolean);

  const crudLocaleEnFile = path.join(CRUD_LOCALE_EN_DIR, `${name}.json`);
  const crudLocaleArFile = path.join(CRUD_LOCALE_AR_DIR, `${name}.json`);

  const baseDir = path.join(process.cwd(), "src", "modules", name);
  ensureDirectories(baseDir, hasCreate || hasUpdate, hasDetail);

  const typesFile = path.join(baseDir, "types", `${name}.type.ts`);
  writeFile(
    typesFile,
    `import { z } from 'zod'\n\nexport const ${pascal}CreateSchema = ${payloadSchemaCode}\n\nexport const ${pascal}UpdateSchema = ${pascal}CreateSchema.partial()\n\nexport type ${pascal}CreatePayload = z.infer<typeof ${pascal}CreateSchema>\nexport type ${pascal}UpdatePayload = z.infer<typeof ${pascal}UpdateSchema>\n\nexport type ${pascal}Entity = ${entityTypeCode}\n`,
  );

  const validationFile = path.join(
    baseDir,
    "validations",
    `${name}.validation.ts`,
  );
  writeFile(
    validationFile,
    `import type { ${pascal}CreatePayload } from '@/modules/${name}/types/${name}.type'\nimport { ${pascal}CreateSchema } from '@/modules/${name}/types/${name}.type'\nimport {\n  hasFormErrors,\n  type FormErrors,\n  validateWithSchema,\n} from '@/shared/lib/forms/zod-form-errors'\n\nexport { ${pascal}CreateSchema }\n\nexport type ${pascal}FormErrors = FormErrors\n\nexport function validate${pascal}Payload(payload: ${pascal}CreatePayload): ${pascal}FormErrors {\n  return validateWithSchema(${pascal}CreateSchema, payload)\n}\n\nexport const has${pascal}ValidationErrors = hasFormErrors\n`,
  );

  const serviceImports = [
    `import { httpClient } from '@/core/api/http.services'`,
    `import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'`,
    `import { unwrapItem, unwrapList, unwrapPaginatedList, type PaginatedListResult } from '@/shared/lib/api/unwrap-api-payload'`,
  ];
  if (hasList) {
    serviceImports.push(
      `import { toAdminListQueryParams, type AdminListFilters, type AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'`,
    );
  }
  const serviceTypeImports = [];
  if (hasList || hasDetail) serviceTypeImports.push(`${pascal}Entity`);
  if (hasCreate) serviceTypeImports.push(`${pascal}CreatePayload`);
  if (hasUpdate) serviceTypeImports.push(`${pascal}UpdatePayload`);
  if (serviceTypeImports.length) {
    serviceImports.push(
      `import type { ${serviceTypeImports.join(", ")} } from '@/modules/${name}/types/${name}.type'`,
    );
  }

  const serviceFunctions = [];

  if (hasList) {
    serviceFunctions.push(
      `export async function list${pascal}(filters: AdminListFilters = {}, pagination: AdminListPagination = {}): Promise<PaginatedListResult<${pascal}Entity>> {\n  const response = await httpClient.get<unknown>(API_ENDPOINTS.${camel}.list, {\n    params: toAdminListQueryParams(filters, pagination),\n  })\n  return unwrapPaginatedList<${pascal}Entity>(response.data)\n}`,
    );
  }

  if (hasDetail) {
    serviceFunctions.push(
      `export async function get${pascal}(identifier: string | number): Promise<${pascal}Entity> {\n  const response = await httpClient.get<unknown>(API_ENDPOINTS.${camel}.detail.replace(':${routeParamName}', String(identifier)))\n  return unwrapItem<${pascal}Entity>(response.data)\n}`,
    );
  }

  if (hasCreate) {
    serviceFunctions.push(
      `export async function create${pascal}(payload: ${pascal}CreatePayload): Promise<${pascal}Entity> {\n  const response = await httpClient.post<unknown>(API_ENDPOINTS.${camel}.create, payload)\n  return unwrapItem<${pascal}Entity>(response.data)\n}`,
    );
  }

  if (hasUpdate) {
    const method = bestCandidate.updateRequest.method.toLowerCase();
    serviceFunctions.push(
      `export async function update${pascal}(identifier: string | number, payload: ${pascal}UpdatePayload): Promise<${pascal}Entity> {\n  const response = await httpClient.${method}<unknown>(API_ENDPOINTS.${camel}.update.replace(':${routeParamName}', String(identifier)), payload)\n  return unwrapItem<${pascal}Entity>(response.data)\n}`,
    );
  }

  if (hasRemove) {
    serviceFunctions.push(
      `export async function remove${pascal}(identifier: string | number): Promise<void> {\n  await httpClient.delete(API_ENDPOINTS.${camel}.remove.replace(':${routeParamName}', String(identifier)))\n}`,
    );
  }

  const serviceFile = path.join(baseDir, "services", `${name}.services.ts`);
  writeFile(
    serviceFile,
    `${serviceImports.join("\n")}\n\n${serviceFunctions.join("\n\n")}\n`,
  );

  const queryExports = [];
  const queryFunctionImports = [];
  if (hasList) queryFunctionImports.push(`list${pascal}`);
  if (hasDetail) queryFunctionImports.push(`get${pascal}`);

  queryExports.push(
    `export const ${camel}QueryKeys = createCrudQueryKeys('${name}')`,
  );

  if (hasList || hasDetail) {
    if (hasList) {
      queryExports.push(
        `export function ${camel}ListQueryOptions(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {\n  return queryOptions({\n    queryKey: ${camel}QueryKeys.list({ ...filters, __page: String(pagination.page ?? ''), __perPage: String(pagination.perPage ?? '') }),\n    queryFn: () => list${pascal}(filters, pagination),\n  })\n}`,
      );
    }

    if (hasDetail) {
      queryExports.push(
        `export function ${camel}DetailQueryOptions(identifier: string) {\n  return queryOptions({\n    queryKey: ${camel}QueryKeys.detail(identifier),\n    queryFn: () => get${pascal}(identifier),\n  })\n}`,
      );
    }
  }

  const queryFile = path.join(baseDir, "queries", `${name}.query.ts`);
  writeFile(
    queryFile,
    `${hasList || hasDetail ? `import { queryOptions } from '@tanstack/react-query'\n\n` : ""}import { createCrudQueryKeys } from '@/shared/constants/crud-query-keys'\n${hasList ? `import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'\n` : ""}${hasList || hasDetail ? `import { ${queryFunctionImports.join(", ")} } from '@/modules/${name}/services/${name}.services'\n` : ""}\n${queryExports.join("\n\n")}\n`,
  );

  const hookImports = [
    `import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'`,
  ];
  const hookQueryImports = [];
  if (hasList) hookQueryImports.push(`${camel}ListQueryOptions`);
  if (hasDetail) hookQueryImports.push(`${camel}DetailQueryOptions`);
  if (hasList || hasDetail) hookQueryImports.push(`${camel}QueryKeys`);
  else hookQueryImports.push(`${camel}QueryKeys`);
  hookImports.push(
    `import { ${hookQueryImports.join(", ")} } from '@/modules/${name}/queries/${name}.query'`,
  );

  const hookServiceImports = [];
  if (hasCreate) hookServiceImports.push(`create${pascal}`);
  if (hasUpdate) hookServiceImports.push(`update${pascal}`);
  if (hasRemove) hookServiceImports.push(`remove${pascal}`);
  if (hookServiceImports.length) {
    hookImports.push(
      `import { ${hookServiceImports.join(", ")} } from '@/modules/${name}/services/${name}.services'`,
    );
  }

  const hookTypeImports = [];
  if (hasCreate) hookTypeImports.push(`${pascal}CreatePayload`);
  if (hasUpdate) hookTypeImports.push(`${pascal}UpdatePayload`);
  if (hookTypeImports.length) {
    hookImports.push(
      `import type { ${hookTypeImports.join(", ")} } from '@/modules/${name}/types/${name}.type'`,
    );
  }
  if (hasList) {
    hookImports.push(
      `import type { AdminListFilters, AdminListPagination } from '@/shared/lib/api/admin-list-query.helpers'`,
    );
  }

  const hookSections = [];

  if (hasList) {
    hookSections.push(
      `export function use${pascal}List(filters: AdminListFilters = {}, pagination: AdminListPagination = {}) {\n  return useQuery(${camel}ListQueryOptions(filters, pagination))\n}`,
    );
  }

  if (hasDetail) {
    hookSections.push(
      `export function use${pascal}ById(identifier: string, enabled = true) {\n  return useQuery({\n    ...${camel}DetailQueryOptions(identifier),\n    enabled: Boolean(identifier) && enabled,\n  })\n}`,
    );
  }

  const mutationRows = [];
  if (hasCreate) {
    mutationRows.push(
      `  const createMutation = useMutation({\n    mutationFn: (payload: ${pascal}CreatePayload) => create${pascal}(payload),\n    onSuccess: invalidate,\n  })`,
    );
  }
  if (hasUpdate) {
    mutationRows.push(
      `  const updateMutation = useMutation({\n    mutationFn: (payload: { identifier: string | number; data: ${pascal}UpdatePayload }) =>\n      update${pascal}(payload.identifier, payload.data),\n    onSuccess: invalidate,\n  })`,
    );
  }
  if (hasRemove) {
    mutationRows.push(
      `  const removeMutation = useMutation({\n    mutationFn: (id: string | number) => remove${pascal}(id),\n    onSuccess: invalidate,\n  })`,
    );
  }

  const mutationReturnRows = [
    hasCreate ? "    createMutation," : null,
    hasUpdate ? "    updateMutation," : null,
    hasRemove ? "    removeMutation," : null,
  ].filter(Boolean);

  hookSections.push(
    `export function use${pascal}CrudMutations() {\n  const queryClient = useQueryClient()\n\n  const invalidate = () =>\n    queryClient.invalidateQueries({\n      queryKey: ${camel}QueryKeys.all,\n    })\n\n${mutationRows.join("\n\n")}\n\n  return {\n${mutationReturnRows.join("\n")}\n  }\n}`,
  );

  const hookFile = path.join(baseDir, "hooks", `use-${name}-crud.hook.ts`);
  writeFile(
    hookFile,
    `${hookImports.join("\n")}\n\n${hookSections.join("\n\n")}\n`,
  );

  const tableFile = path.join(baseDir, 'components', `${name}.table.component.tsx`)
writeFile(
  tableFile,
  `import { Eye, Pencil, Trash2 } from 'lucide-react'\nimport { useMemo } from 'react'\nimport { useTranslation } from 'react-i18next'\n\nimport type { ${pascal}Entity } from '@/modules/${name}/types/${name}.type'\nimport { toDateLabel } from '@/shared/lib/data-value.helpers'\nimport { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'\nimport { PaginatedDataTable, TableRowActionsMenu, type DataTableColumn, type TableRowActionItem } from '@/shared/ui'\n\nconst columns = [\n${entityColumns}\n]\n\nexport const ${pascal}TableColumns = columns\n\ntype ${pascal}TableProps = {\n  rows: ${pascal}Entity[]\n  visibleColumnKeys?: string[]\n  searchValues?: Record<string, string>\n  page: number\n  pageSize: number\n  totalItems?: number\n  totalPages?: number\n  onPageChange: (page: number) => void\n  onPageSizeChange: (pageSize: number) => void\n  canView?: boolean\n  canEdit?: boolean\n  canDelete?: boolean\n  onView?: (row: ${pascal}Entity) => void\n  onEdit?: (row: ${pascal}Entity) => void\n  onDelete?: (row: ${pascal}Entity) => void\n}\n\nfunction renderCellValue(row: ${pascal}Entity, column: (typeof columns)[number], locale: string): string {\n  const rawValue = (row as Record<string, unknown>)[column.key]\n\n  if (column.isDate) {\n    return toDateLabel(rawValue, { locale })\n  }\n\n  if (Array.isArray(rawValue)) {\n    return rawValue.length ? rawValue.map((item) => formatUiDisplayValue(item)).join(' â€¢ ') : '-'\n  }\n\n  if (rawValue && typeof rawValue === 'object') {\n    return formatUiDisplayValue(JSON.stringify(rawValue))\n  }\n\n  return formatUiDisplayValue(rawValue)\n}\n\nexport function ${pascal}Table({\n  rows,\n  visibleColumnKeys,\n  searchValues,\n  page,\n  pageSize,\n  totalItems,\n  totalPages: totalPagesFromServer,\n  onPageChange,\n  onPageSizeChange,\n  canView = true,\n  canEdit = true,\n  canDelete = true,\n  onView,\n  onEdit,\n  onDelete,\n}: ${pascal}TableProps) {\n  const { t, i18n } = useTranslation('${name}')\n\n  const visibleColumns = useMemo(() => {\n    if (!visibleColumnKeys?.length) {\n      return columns\n    }\n\n    const visibleKeys = new Set(visibleColumnKeys)\n    return columns.filter((column) => visibleKeys.has(column.key))\n  }, [visibleColumnKeys])\n\n  const normalizedSearchEntries = useMemo(\n    () =>\n      Object.entries(searchValues ?? {}).filter(([, value]) =>\n        String(value ?? '').trim().length > 0\n      ),\n    [searchValues]\n  )\n\n  const filteredRows = useMemo(() => {\n    if (!normalizedSearchEntries.length) {\n      return rows\n    }\n\n    return rows.filter((row) =>\n      normalizedSearchEntries.every(([key, value]) => {\n        const rowValue = formatUiDisplayValue((row as Record<string, unknown>)[key])\n        return rowValue.toLowerCase().includes(String(value).toLowerCase())\n      })\n    )\n  }, [normalizedSearchEntries, rows])\n\n  const isServerPaginated = typeof totalPagesFromServer === 'number' && Number.isFinite(totalPagesFromServer)\n  const totalPages = isServerPaginated\n    ? Math.max(1, Math.trunc(totalPagesFromServer))\n    : Math.max(1, Math.ceil(filteredRows.length / pageSize))\n  const safePage = isServerPaginated ? Math.max(1, page) : Math.min(Math.max(1, page), totalPages)\n  const startIndex = (safePage - 1) * pageSize\n  const pagedRows = isServerPaginated ? filteredRows : filteredRows.slice(startIndex, startIndex + pageSize)\n  const totalCount = isServerPaginated ? Math.max(0, Math.trunc(totalItems ?? filteredRows.length)) : filteredRows.length\n\n  const tableColumns = useMemo<DataTableColumn<${pascal}Entity>[]>(() => {\n    const mapped: DataTableColumn<${pascal}Entity>[] = visibleColumns.map((column) => ({\n      id: column.key,\n      header: t(column.labelKey),\n      renderCell: (row) => renderCellValue(row, column, i18n.language),\n    }))\n\n    const actions: TableRowActionItem<${pascal}Entity>[] = []\n\n    if (canView) {\n      actions.push({\n        key: 'view',\n        label: t('common.actions.view', { ns: 'translation' }),\n        icon: <Eye className="size-4" />,\n        onClick: (row) => onView?.(row),\n      })\n    }\n\n    if (canEdit) {\n      actions.push({\n        key: 'edit',\n        label: t('common.actions.edit', { ns: 'translation' }),\n        icon: <Pencil className="size-4" />,\n        onClick: (row) => onEdit?.(row),\n      })\n    }\n\n    if (canDelete) {\n      actions.push({\n        key: 'delete',\n        label: t('common.actions.delete', { ns: 'translation' }),\n        icon: <Trash2 className="size-4" />,\n        variant: 'destructive',\n        onClick: (row) => onDelete?.(row),\n      })\n    }\n\n    if (actions.length) {\n      mapped.push({\n        id: 'actions',\n        header: t('common.table.actions', { ns: 'translation' }),\n        headerClassName: 'w-24 text-end',\n        cellClassName: 'text-end',\n        renderCell: (row) => (\n          <div className="flex justify-end">\n            <TableRowActionsMenu\n              row={row}\n              actions={actions}\n              triggerAriaLabel={t('common.table.actions', { ns: 'translation' })}\n            />\n          </div>\n        ),\n      })\n    }\n\n    return mapped\n  }, [visibleColumns, t, i18n.language, canView, canEdit, canDelete, onView, onEdit, onDelete])\n\n  return (\n    <PaginatedDataTable\n      rows={pagedRows}\n      columns={tableColumns}\n      getRowId={(row) => String((row as Record<string, unknown>).id ?? Math.random())}\n      emptyMessage={t('common.table.empty', { ns: 'translation' })}\n      summaryText={t('common.table.summary', {\n        ns: 'translation',\n        from: totalCount ? startIndex + 1 : 0,\n        to: Math.min(startIndex + pagedRows.length, totalCount),\n        total: totalCount,\n      })}\n      pagination={{\n        currentPage: safePage,\n        totalPages,\n        onPageChange,\n        previousLabel: t('common.pagination.previous', { ns: 'translation' }),\n        nextLabel: t('common.pagination.next', { ns: 'translation' }),\n        getPageLabel: (nextPage) =>\n          t('common.pagination.pageLabel', { ns: 'translation', page: nextPage }),\n        pageSize,\n        pageSizeOptions: [10, 20, 50, 100],\n        onPageSizeChange,\n        pageSizeLabel: t('common.pagination.pageSize', { ns: 'translation' }),\n        pageSizeAriaLabel: t('common.pagination.pageSize', { ns: 'translation' }),\n      }}\n    />\n  )\n}\n`,
)

const pageFile = path.join(baseDir, 'pages', `${name}.page.tsx`)
const pageMutationBinding = hasRemove
  ? `const { removeMutation } = use${pascal}CrudMutations()`
  : `use${pascal}CrudMutations()`
const pageActions = hasCreate
  ? `<Button
            type="button"
            icon={<Plus className="size-4" />}
            onClick={() => navigate(APP_ROUTES.add${pascal}.path)}
          >
            {t('common.actions.add', { ns: 'translation' })} {entitySingular}
          </Button>`
  : 'null'
const pageHandlers = [
  hasDetail
    ? `        onView={(row) => navigate(APP_ROUTES.view${pascal}.path.replace(':${routeParamName}', String((row as Record<string, unknown>).${detailLookupField} ?? row.id ?? '')))}`
    : '',
  hasUpdate
    ? `        onEdit={(row) => navigate(APP_ROUTES.edit${pascal}.path.replace(':${routeParamName}', String((row as Record<string, unknown>).${detailLookupField} ?? row.id ?? '')))}`
    : '',
  hasRemove
    ? `        onDelete={(row) => removeMutation.mutate(String((row as Record<string, unknown>).${detailLookupField} ?? row.id ?? ''))}`
    : '',
]
  .filter(Boolean)
  .join('\n')

writeFile(
  pageFile,
  `import { Plus } from 'lucide-react'\nimport { useMemo, useState } from 'react'\nimport { useTranslation } from 'react-i18next'\nimport { useNavigate } from 'react-router-dom'\n\nimport { APP_ROUTES } from '@/app/router/route-object.type'\nimport { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'\nimport { ${pascal}Table, ${pascal}TableColumns } from '@/modules/${name}/components/${name}.table.component'\nimport { ${hasList ? `use${pascal}List, ` : ''}use${pascal}CrudMutations } from '@/modules/${name}/hooks/use-${name}-crud.hook'\nimport type { ${pascal}Entity } from '@/modules/${name}/types/${name}.type'\nimport { useCrudTableSettings } from '@/shared/lib/use-crud-table-settings'\nimport { Button, ColumnsVisibilityMenu, FiltersDialog, Input, PageHeader } from '@/shared/ui'\n\nconst defaultSearchValues: Record<string, string> = ${searchDefaultsLiteral}\n\nexport default function ${pascal}Page() {\n  const { t } = useTranslation('${name}')\n  const navigate = useNavigate()\n  const entityPlural = t('entity.plural', { defaultValue: ${entityPluralTitleLiteral} })\n  const entitySingular = t('entity.singular', { defaultValue: ${entitySingularTitleLiteral} })\n  ${pageMutationBinding}\n\n  const defaultColumns = useMemo(\n    () =>\n      ${pascal}TableColumns.map((column) => ({\n        id: column.key,\n        label: t(column.labelKey),\n        visible: true,\n      })),\n    [t]\n  )\n\n  const tableSettings = useCrudTableSettings({\n    pageKey: '${camel}-table',\n    defaultColumns,\n    defaultSearchValues,\n    defaultPagination: { pageIndex: 1, pageSize: 10 },\n  })\n\n  ${hasList ? `const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)\n  const [pendingFilters, setPendingFilters] = useState<Record<string, string>>(() => tableSettings.searchValues)\n  const listQuery = use${pascal}List(appliedFilters, {\n    page: tableSettings.pagination.pageIndex,\n    perPage: tableSettings.pagination.pageSize,\n  })` : `const listQuery = { data: { items: [] as ${pascal}Entity[], total: 0, lastPage: 1 } }`}\n\n  ${hasList ? `const activeFiltersCount = useMemo(\n    () => Object.values(pendingFilters).filter((value) => String(value).trim().length > 0).length,\n    [pendingFilters]\n  )` : `const activeFiltersCount = tableSettings.activeFiltersCount`}\n\n  const headerActions = (\n    <div className=\"flex flex-wrap items-center gap-2\">\n      <FiltersDialog\n        triggerLabel={t('common.filters.title', { ns: 'translation' })}\n        title={t('common.filters.title', { ns: 'translation' })}\n        activeFiltersCount={activeFiltersCount}\n        applyLabel={t('common.actions.apply', { ns: 'translation' })}\n        resetLabel={t('common.actions.reset', { ns: 'translation' })}\n        onApply={() => {\n          ${hasList ? `const nextFilters = { ...pendingFilters }\n          setAppliedFilters(nextFilters)\n          tableSettings.setSearchValues(nextFilters)` : `tableSettings.reset()`}\n        }}\n        onReset={() => {\n          ${hasList ? `setPendingFilters(defaultSearchValues)\n          setAppliedFilters(defaultSearchValues)` : ``}\n          tableSettings.reset()\n        }}\n        triggerVariant=\"filter\"\n      >\n        {${pascal}TableColumns.map((column) => (\n          <div key={column.key} className=\"space-y-1.5\">\n            <p className=\"text-xs font-medium text-muted-foreground\">{t(column.labelKey)}</p>\n            <Input\n              value={${hasList ? `pendingFilters[column.key] ?? ''` : `tableSettings.searchValues[column.key] ?? ''`}}\n              onChange={(event) => ${hasList ? `setPendingFilters((previous) => ({ ...previous, [column.key]: event.target.value }))` : `tableSettings.setSearchValue(column.key, event.target.value)`}}\n              variant=\"filter\"\n            />\n          </div>\n        ))}\n      </FiltersDialog>\n\n      <ColumnsVisibilityMenu\n        columns={tableSettings.columns}\n        onChange={tableSettings.setColumns}\n        onReset={tableSettings.reset}\n        triggerLabel={t('common.table.columns', { ns: 'translation' })}\n        title={t('common.table.columns', { ns: 'translation' })}\n        applyLabel={t('common.actions.apply', { ns: 'translation' })}\n        resetLabel={t('common.actions.reset', { ns: 'translation' })}\n      />\n\n      ${hasCreate
        ? `<Button
        type="button"
        icon={<Plus className="size-4" />}
        onClick={() => navigate(APP_ROUTES.add${pascal}.path)}
      >
        {t('common.actions.add', { ns: 'translation' })} {entitySingular}
      </Button>`
        : ''}
    </div>
  )\n\n  return (\n    <section className=\"space-y-6\ w-full\ flex\ flex-col\">\n      <PageHeader\n        breadcrumbs={<AppBreadcrumbs />}\n        title={entityPlural}\n        description={t('page.description')}\n        actions={headerActions}\n      />\n\n      <${pascal}Table\n        rows={(listQuery.data?.items ?? []) as ${pascal}Entity[]}\n        visibleColumnKeys={tableSettings.visibleColumnKeys}\n        searchValues={tableSettings.searchValues}\n        page={tableSettings.pagination.pageIndex}\n        pageSize={tableSettings.pagination.pageSize}\n        totalItems={listQuery.data?.total}\n        totalPages={listQuery.data?.lastPage}\n        onPageChange={(page) =>\n          tableSettings.setPagination({\n            ...tableSettings.pagination,\n            pageIndex: page,\n          })\n        }\n        onPageSizeChange={(pageSize) =>\n          tableSettings.setPagination({\n            ...tableSettings.pagination,\n            pageSize,\n            pageIndex: 1,\n          })\n        }\n        canView={${hasDetail}}\n        canEdit={${hasUpdate}}\n        canDelete={${hasRemove}}\n${pageHandlers}\n      />\n    </section>\n  )\n}\n`,
)

if (hasCreate || hasUpdate) {
    const initialStateLiteral = initialStateCode.startsWith("{")
      ? initialStateCode
      : `{\n  value: ${initialStateCode},\n}`;
    const hasBooleanFields = formFieldLocaleDefs.some(
      (field) => field.kind === "boolean",
    );
    const hasArrayFields = formFieldLocaleDefs.some(
      (field) => field.kind === "array",
    );
    const hasRelationFields = relationFieldDefs.length > 0;
    const hasEnumFields = enumFieldDefs.length > 0;
    const hasInputFields = formFieldLocaleDefs.some(
      (field) =>
        field.kind !== "boolean" &&
        field.inputKind !== "relation-select" &&
        field.inputKind !== "enum-select",
    );
    const formUiImports = ["Button", "PageHeader"];
    if (hasInputFields) {
      formUiImports.push("FormField", "Input");
    }
    if (hasArrayFields) {
      formUiImports.push("FormField", "Input");
    }
    if (
      (hasRelationFields || hasEnumFields) &&
      !formUiImports.includes("FormField")
    ) {
      formUiImports.push("FormField");
    }
    if (hasRelationFields || hasEnumFields) {
      formUiImports.push("CustomSelect");
    }
    if (hasBooleanFields) {
      formUiImports.push("FormToggleRow");
    }
    const formUiImportsUnique = Array.from(new Set(formUiImports));

    const arrayFieldPathsLiteral = JSON.stringify(
      formFieldLocaleDefs
        .filter((field) => field.kind === "array")
        .map((field) => field.path),
    );

    const fieldBlocks = formFieldLocaleDefs
      .map((field) => {
        const fieldId = `${name}-${field.path.replace(/\./g, "-")}`;
        const requiredMark = field.required ? " *" : "";
        const fieldLabelExpression = `\${t('form.fields.${field.localeKey}')}${requiredMark}`;

        if (field.kind === "boolean") {
          return `        <FormToggleRow\n          label={\`${fieldLabelExpression}\`}\n          checked={Boolean(getValueAtPath(form, '${field.path}'))}\n          onCheckedChange={(checked) =>\n            setDraft((previous) =>\n              setValueAtPath(previous as Record<string, unknown>, '${field.path}', checked) as Partial<${pascal}CreatePayload>\n            )\n          }\n        />`;
        }

        if (field.kind === "file") {
          return `        <FormField htmlFor=\"${fieldId}\" label={\`${fieldLabelExpression}\`} error={translateFormError(errors['${field.path}'], t)}>\n          <Input\n            id=\"${fieldId}\"\n            type=\"file\"\n            onChange={(event) => {\n              const nextFile = event.target.files?.[0]\n              if (!nextFile) {\n                return\n              }\n\n              setDraft((previous) =>\n                setValueAtPath(previous as Record<string, unknown>, '${field.path}', nextFile) as Partial<${pascal}CreatePayload>\n              )\n            }}\n          />\n        </FormField>`;
        }

        if (field.kind === "array") {
          return `        <FormField htmlFor=\"${fieldId}\" label={\`${fieldLabelExpression}\`} error={translateFormError(errors['${field.path}'], t)}>
          <div className=\"space-y-2\">
            {((getValueAtPath(form, '${field.path}') as unknown[] | undefined) ?? []).map((item, index) => {
              const itemRecord = item && typeof item === 'object' && !Array.isArray(item)
                ? (item as Record<string, unknown>)
                : { value: item }

              return (
                <div key={index} className=\"space-y-2 rounded-md border border-border p-2\">
                  {Object.entries(itemRecord).map(([entryKey, entryValue]) => (
                    <Input
                      key={entryKey}
                      id={index === 0 ? \"${fieldId}-\${entryKey}\" : undefined}
                      placeholder={entryKey}
                      value={String(entryValue ?? '')}
                      onChange={(event) =>
                        setDraft((previous) => {
                          const current = (getValueAtPath({ ...form, ...previous }, '${field.path}') as unknown[] | undefined) ?? []
                          const nextArray = [...current]
                          const nextItem =
                            nextArray[index] && typeof nextArray[index] === 'object' && !Array.isArray(nextArray[index])
                              ? { ...(nextArray[index] as Record<string, unknown>) }
                              : {}

                          nextItem[entryKey] = event.target.value
                          nextArray[index] = nextItem

                          return setValueAtPath(previous as Record<string, unknown>, '${field.path}', nextArray) as Partial<${pascal}CreatePayload>
                        })
                      }
                    />
                  ))}

                  <div className=\"flex justify-end\">
                    <Button
                      type=\"button\"
                      variant=\"outline\"
                      onClick={() =>
                        setDraft((previous) => {
                          const current = (getValueAtPath({ ...form, ...previous }, '${field.path}') as unknown[] | undefined) ?? []
                          const nextArray = current.filter((_, entryIndex) => entryIndex !== index)
                          return setValueAtPath(previous as Record<string, unknown>, '${field.path}', nextArray) as Partial<${pascal}CreatePayload>
                        })
                      }
                    >
                      {t('common.actions.delete', { ns: 'translation' })}
                    </Button>
                  </div>
                </div>
              )
            })}
            <Button
              type=\"button\"
              variant=\"outline\"
              onClick={() =>
                setDraft((previous) => {
                  const current = (getValueAtPath({ ...form, ...previous }, '${field.path}') as unknown[] | undefined) ?? []
                  const first = current[0]
                  const template =
                    first && typeof first === 'object' && !Array.isArray(first)
                      ? Object.fromEntries(Object.keys(first as Record<string, unknown>).map((key) => [key, '']))
                      : { value: '' }

                  return setValueAtPath(previous as Record<string, unknown>, '${field.path}', [...current, template]) as Partial<${pascal}CreatePayload>
                })
              }
            >
              {t('common.actions.add', { ns: 'translation' })}
            </Button>
          </div>
        </FormField>`;
        }

        if (field.inputKind === "enum-select") {
          const optionsLiteral = JSON.stringify(
            (field.enumValues ?? []).map((value) => ({
              value,
              label: value,
            })),
            null,
            2,
          );

          return `        <FormField htmlFor=\"${fieldId}\" label={\`${fieldLabelExpression}\`} error={translateFormError(errors['${field.path}'], t)}>\n          <CustomSelect\n            id=\"${fieldId}\"\n            value={String((getValueAtPath(form, '${field.path}') as string | undefined) ?? '')}\n            options={${optionsLiteral}}\n            onValueChange={(value) =>\n              setDraft((previous) =>\n                setValueAtPath(previous as Record<string, unknown>, '${field.path}', value) as Partial<${pascal}CreatePayload>\n              )\n            }\n          />\n        </FormField>`;
        }

        if (field.inputKind === "relation-select") {
          const valueExpression =
            field.kind === "number"
              ? `String((getValueAtPath(form, '${field.path}') as number | undefined) ?? '')`
              : `String((getValueAtPath(form, '${field.path}') as string | undefined) ?? '')`;
          const nextValue =
            field.kind === "number"
              ? "value === '' ? 0 : Number(value)"
              : "value";

          return `        <FormField htmlFor=\"${fieldId}\" label={\`${fieldLabelExpression}\`} error={translateFormError(errors['${field.path}'], t)}>\n          <CustomSelect\n            id=\"${fieldId}\"\n            value={${valueExpression}}\n            options={relationOptionsByField[${JSON.stringify(field.path)}] ?? []}\n            onValueChange={(value) =>\n              setDraft((previous) =>\n                setValueAtPath(previous as Record<string, unknown>, '${field.path}', ${nextValue}) as Partial<${pascal}CreatePayload>\n              )\n            }\n          />\n        </FormField>`;
        }

        const inputType =
          field.kind === "number"
            ? "number"
            : field.kind === "string" &&
                field.path.toLowerCase().includes("date")
              ? "date"
              : "text";
        const valueExpression =
          field.kind === "number"
            ? `String((getValueAtPath(form, '${field.path}') as number | undefined) ?? '')`
            : `String((getValueAtPath(form, '${field.path}') as string | undefined) ?? '')`;
        const nextValue =
          field.kind === "number"
            ? "event.target.value === '' ? 0 : Number(event.target.value)"
            : "event.target.value";

        return `        <FormField htmlFor=\"${fieldId}\" label={\`${fieldLabelExpression}\`} error={translateFormError(errors['${field.path}'], t)}>\n          <Input\n            id=\"${fieldId}\"\n            type=\"${inputType}\"\n            value={${valueExpression}}\n            onChange={(event) =>\n              setDraft((previous) =>\n                setValueAtPath(previous as Record<string, unknown>, '${field.path}', ${nextValue}) as Partial<${pascal}CreatePayload>\n              )\n            }\n          />\n        </FormField>`;
      })
      .join("\n\n");

    const relationQueryEntries = relationFieldDefs
      .map((field) => {
        const queryKey = `${camel}-relation-${field.path}`;
        return `    ${JSON.stringify(field.path)}: useQuery({\n      queryKey: ['${queryKey}'],\n      queryFn: () => fetchCrudRelationOptions(getCrudRelationEndpoint('${camel}', ${JSON.stringify(field.path)})),\n      enabled: Boolean(getCrudRelationEndpoint('${camel}', ${JSON.stringify(field.path)})),\n    }),`;
      })
      .join("\n");

    const relationOptionsByFieldCode = hasRelationFields
      ? `  const relationOptionQueries = {\n${relationQueryEntries}\n  }\n\n  const relationOptionsByField = Object.fromEntries(\n    Object.entries(relationOptionQueries).map(([key, query]) => [\n      key,\n      (query.data ?? []).map((option) => ({\n        value: option.value,\n        label: option.label,\n      })),\n    ])\n  ) as Record<string, { value: string; label: string }[]>\n`
      : `  const relationOptionsByField: Record<string, { value: string; label: string }[]> = {}\n`;

    const formExtraImports = [
      hasRelationFields
        ? `import { useQuery } from '@tanstack/react-query'`
        : null,
      hasRelationFields
        ? `import { getCrudRelationEndpoint } from '@/shared/constants/crud-relations-map'`
        : null,
      hasRelationFields
        ? `import { fetchCrudRelationOptions } from '@/shared/lib/forms/crud-relation-options'`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const formPageFile = path.join(
      baseDir,
      "pages",
      "form",
      `${name}.form.page.tsx`,
    );
    writeFile(
      formPageFile,
      `import { useMemo, useState } from 'react'\nimport { useTranslation } from 'react-i18next'\nimport { useNavigate, useParams } from 'react-router-dom'\n${formExtraImports ? `${formExtraImports}\n` : ""}\nimport { APP_ROUTES } from '@/app/router/route-object.type'\nimport { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'\nimport { use${pascal}CrudMutations${hasDetail ? `, use${pascal}ById` : ""} } from '@/modules/${name}/hooks/use-${name}-crud.hook'\nimport type { ${pascal}CreatePayload } from '@/modules/${name}/types/${name}.type'\nimport {\n  ${pascal}CreateSchema,\n  has${pascal}ValidationErrors,\n  validate${pascal}Payload,\n  type ${pascal}FormErrors,\n} from '@/modules/${name}/validations/${name}.validation'\nimport { translateFormError } from '@/shared/lib/forms/zod-form-errors'\nimport { ${formUiImportsUnique.join(", ")} } from '@/shared/ui'\n\nconst initialState: ${pascal}CreatePayload = ${initialStateLiteral}\n\nfunction getValueAtPath(target: unknown, path: string): unknown {\n  const segments = path.split('.').filter(Boolean)\n\n  let cursor: unknown = target\n  for (const segment of segments) {\n    if (!cursor || typeof cursor !== 'object') {\n      return undefined\n    }\n\n    cursor = (cursor as Record<string, unknown>)[segment]\n  }\n\n  return cursor\n}\n\nfunction setValueAtPath<T extends Record<string, unknown>>(target: T, path: string, value: unknown): T {\n  const segments = path.split('.').filter(Boolean)\n\n  if (!segments.length) {\n    return target\n  }\n\n  const clone = { ...target }\n  let cursor: Record<string, unknown> = clone\n\n  for (let index = 0; index < segments.length; index += 1) {\n    const segment = segments[index]\n    const isLeaf = index === segments.length - 1\n\n    if (isLeaf) {\n      cursor[segment] = value\n      break\n    }\n\n    const nextValue = cursor[segment]\n    const nextObject =\n      nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)\n        ? { ...(nextValue as Record<string, unknown>) }\n        : {}\n\n    cursor[segment] = nextObject\n    cursor = nextObject\n  }\n\n  return clone as T\n}\n\nfunction toCreatePayload(value: unknown): ${pascal}CreatePayload {\n  const merged =\n    value && typeof value === 'object'\n      ? { ...initialState, ...(value as Record<string, unknown>) }\n      : initialState\n\n  const parsed = ${pascal}CreateSchema.partial().safeParse(merged)\n  if (!parsed.success) {\n    return merged as ${pascal}CreatePayload\n  }\n\n  return { ...initialState, ...parsed.data } as ${pascal}CreatePayload\n}\n\nfunction applyArrayInputsToForm<T extends Record<string, unknown>>(\n  source: T,\n  arrayInputs: Record<string, string>,\n  arrayPaths: string[]\n): { value: T; errors: Record<string, string> } {\n  let nextValue = source\n  const nextErrors: Record<string, string> = {}\n\n  for (const path of arrayPaths) {\n    if (!(path in arrayInputs)) {\n      continue\n    }\n\n    const rawValue = arrayInputs[path]?.trim()\n    if (!rawValue) {\n      nextValue = setValueAtPath(nextValue, path, [])\n      continue\n    }\n\n    try {\n      const parsed = JSON.parse(rawValue)\n      if (!Array.isArray(parsed)) {\n        nextErrors[path] = 'Array JSON is required'\n        continue\n      }\n\n      nextValue = setValueAtPath(nextValue, path, parsed)\n    } catch {\n      nextErrors[path] = 'Invalid JSON array'\n    }\n  }\n\n  return { value: nextValue, errors: nextErrors }\n}\n\nexport default function ${pascal}FormPage() {\n  const { id } = useParams()\n  const navigate = useNavigate()\n  const { t } = useTranslation('${name}')\n  const entitySingular = t('entity.singular', { defaultValue: ${entitySingularTitleLiteral} })\n\n  const isEdit = useMemo(() => Boolean(id), [id])\n  ${hasDetail ? `const detailQuery = use${pascal}ById(id ?? '', isEdit)` : `const detailQuery = { data: null as null | Partial<${pascal}CreatePayload> }`}\n  const { ${hasCreate ? "createMutation," : ""} ${hasUpdate ? "updateMutation," : ""} } = use${pascal}CrudMutations()\n\n  const [draft, setDraft] = useState<Partial<${pascal}CreatePayload>>({})\n  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({})\n  const [errors, setErrors] = useState<${pascal}FormErrors>({})\n\n  const baseForm = useMemo<${pascal}CreatePayload>(\n    () => toCreatePayload(detailQuery.data),\n    [detailQuery.data]\n  )\n\n  const form = useMemo<${pascal}CreatePayload>(\n    () => ({ ...baseForm, ...draft }),\n    [baseForm, draft]\n  )\n\n${relationOptionsByFieldCode}\n  const handleSubmit = async () => {\n    const { value: nextForm, errors: arrayErrors } = applyArrayInputsToForm(\n      form as Record<string, unknown>,\n      arrayInputs,\n      ${arrayFieldPathsLiteral}\n    )\n\n    const nextErrors = {\n      ...validate${pascal}Payload(nextForm as ${pascal}CreatePayload),\n      ...arrayErrors,\n    }\n    setErrors(nextErrors)\n\n    if (has${pascal}ValidationErrors(nextErrors)) {\n      return\n    }\n\n    if (isEdit && id) {\n      ${hasUpdate ? `await updateMutation.mutateAsync({ identifier: id, data: nextForm as ${pascal}CreatePayload })` : "return"}\n    } else {\n      ${hasCreate ? `await createMutation.mutateAsync(nextForm as ${pascal}CreatePayload)` : "return"}\n    }\n\n    navigate(APP_ROUTES.${camel}.path)\n  }\n\n  return (\n    <section className=\"flex min-h-0 flex-1 flex-col gap-6 overflow-hidden\">\n      <PageHeader\n        breadcrumbs={<AppBreadcrumbs />}\n        title={(isEdit ? t('common.actions.edit', { ns: 'translation' }) : t('common.actions.add', { ns: 'translation' })) + ' ' + entitySingular}\n        description={isEdit ? t('common.form.updateDescription', { ns: 'translation' }) : t('common.form.createDescription', { ns: 'translation' })}\n      />\n\n      <div className=\"space-y-4 rounded-md border border-border bg-card p-4\">\n${fieldBlocks ? `        <div className=\"grid grid-cols-1 gap-4 md:grid-cols-2\">\n${fieldBlocks}\n        </div>` : `        <p className=\"text-sm text-muted-foreground\">{t('common.form.noEditableFields', { ns: 'translation' })}</p>`}\n\n        <div className=\"flex justify-end gap-2\">\n          <Button type=\"button\" variant=\"outline\" onClick={() => navigate(APP_ROUTES.${camel}.path)}>\n            {t('common.actions.cancel', { ns: 'translation' })}\n          </Button>\n          <Button\n            type=\"button\"\n            onClick={() => void handleSubmit()}\n            loading={createMutation.isPending || updateMutation.isPending}\n            disabled={createMutation.isPending || updateMutation.isPending || (isEdit ? ${hasUpdate ? "false" : "true"} : ${hasCreate ? "false" : "true"})}\n          >\n            {isEdit ? t('common.actions.update', { ns: 'translation' }) : t('common.actions.create', { ns: 'translation' })}\n          </Button>\n        </div>\n      </div>\n    </section>\n  )\n}\n`,
    );
  }

  if (hasDetail) {
    const viewFile = path.join(
      baseDir,
      "pages",
      "view",
      `${name}.view.page.tsx`,
    );
    writeFile(
      viewFile,
      `import { useMemo } from 'react'\nimport { useTranslation } from 'react-i18next'\nimport { Link, useParams } from 'react-router-dom'\n\nimport { APP_ROUTES } from '@/app/router/route-object.type'\nimport { AppBreadcrumbs } from '@/app/layout/app-breadcrumbs.component'\nimport { use${pascal}ById } from '@/modules/${name}/hooks/use-${name}-crud.hook'\nimport { formatUiDisplayValue } from '@/shared/lib/display-format.helpers'\nimport { formatTranslationForLocale } from '@/shared/lib/translation-display.helpers'\nimport { Button, Card, CardContent, DetailsField, PageHeader } from '@/shared/ui'\n\nexport default function ${pascal}ViewPage() {\n  const { t, i18n } = useTranslation('${name}')\n  const entityPlural = t('entity.plural', { defaultValue: ${entityPluralTitleLiteral} })\n  const { id } = useParams()\n  const detailQuery = use${pascal}ById(id ?? '', Boolean(id))\n\n  const detail = (detailQuery.data ?? {}) as Record<string, unknown>\n\n  const summaryEntries = useMemo(\n    () =>\n      Object.entries(detail).filter(([key]) =>\n        !['translations', 'media', 'map_areas'].includes(key)\n      ),\n    [detail]\n  )\n\n  const translations = Array.isArray(detail.translations) ? detail.translations : []\n\n  return (\n    <section className=\"flex min-h-0 flex-1 flex-col gap-6 overflow-hidden\">\n      <PageHeader breadcrumbs={<AppBreadcrumbs />} title={t('view.title')} />\n\n      <div className=\"grid grid-cols-1 gap-4 lg:grid-cols-3\">\n        <Card className=\"rounded-md border border-border bg-card lg:col-span-2\">\n          <CardContent className=\"grid grid-cols-1 gap-4 p-4 md:grid-cols-2\">\n            <DetailsField\n              label={t('table.columns.translations', { defaultValue: 'Translations' })}\n              value={formatTranslationForLocale(translations, i18n.language, ['title', 'name', 'label', 'question'])}\n            />\n            {summaryEntries.map(([key, value]) => (\n              <DetailsField key={key} label={key} value={formatUiDisplayValue(value)} />\n            ))}\n          </CardContent>\n        </Card>\n\n        <Card className=\"rounded-md border border-border bg-card\">\n          <CardContent className=\"space-y-3 p-4\">\n            <p className=\"text-sm font-semibold text-foreground\">\n              {t('table.columns.translations', { defaultValue: 'Translations' })}\n            </p>\n            {translations.length ? (\n              translations.map((entry, index) => {\n                const item = entry && typeof entry === 'object'\n                  ? (entry as Record<string, unknown>)\n                  : {}\n                const lang = String(item.lang ?? '-').toUpperCase()\n                const title = String(item.title ?? item.name ?? item.label ?? item.question ?? '-').trim() || '-'\n                const description = String(item.description ?? item.subtitle ?? item.answer ?? item.short_description ?? '-').trim() || '-'\n\n                return (\n                  <div key={String(item.lang ?? index) + '-' + String(index)} className=\"rounded-md border border-border/70 bg-muted/20 p-3\">\n                    <p className=\"text-xs font-semibold text-muted-foreground\">{lang}</p>\n                    <p className=\"text-sm font-medium text-foreground\">{title}</p>\n                    <p className=\"text-xs text-muted-foreground\">{description}</p>\n                  </div>\n                )\n              })\n            ) : (\n              <p className=\"text-xs text-muted-foreground\">-</p>\n            )}\n          </CardContent>\n        </Card>\n      </div>\n\n      <div className=\"flex justify-end\">\n        <Button asChild variant=\"outline\">\n          <Link to={APP_ROUTES.${camel}.path}>{t('common.actions.back', { ns: 'translation' })} {entityPlural}</Link>\n        </Button>\n      </div>\n    </section>\n  )\n}\n`,
    );
  }

  upsertApiEndpoints(camel, endpointPaths);
  addRoutes({
    name,
    camel,
    pascal,
    includeCreate: hasCreate,
    includeUpdate: hasUpdate,
    includeView: hasDetail,
    protectedRoutes,
    routeParamName,
  });
  addAppRoute({
    name,
    camel,
    pascal,
    includeCreate: hasCreate,
    includeUpdate: hasUpdate,
    includeView: hasDetail,
  });
  upsertSidebarPrimaryItem({
    id: camel,
    routeKey: camel,
    labelKey: `sidebar.items.${camel}`,
    includeAdd: hasCreate,
    includeEdit: hasUpdate,
    includeView: hasDetail,
    routeParamName,
  });
  upsertSidebarLocaleKey(SIDEBAR_LOCALE_EN_FILE, camel, title);
  upsertSidebarLocaleKey(SIDEBAR_LOCALE_AR_FILE, camel, title);
  upsertCrudPermissions(camel, camel);
  upsertCrudRelationEndpoints(camel, relationFieldEndpointMap);
  upsertTranslationKeysFile({
    localeFile: crudLocaleEnFile,
    keys: crudTranslationKeys,
  });
  upsertTranslationKeysFile({
    localeFile: crudLocaleArFile,
    keys: crudTranslationKeys,
  });
  upsertTranslationKeysFile({
    localeFile: path.join(CRUD_LOCALE_EN_DIR, "common.json"),
    keys: ["validation.duplicateLanguage"],
  });
  upsertTranslationKeysFile({
    localeFile: path.join(CRUD_LOCALE_AR_DIR, "common.json"),
    keys: ["validation.duplicateLanguage"],
  });

  console.log(`CRUD module created at src/modules/${name}`);
  console.log(
    `Matched operations: ${[
      hasList ? "list" : null,
      hasDetail ? "detail" : null,
      hasCreate ? "create" : null,
      hasUpdate ? `update(${bestCandidate.updateRequest.method})` : null,
      hasRemove ? "remove" : null,
    ]
      .filter(Boolean)
      .join(", ")}`,
  );
  console.log(`Scope: ${scopeLabel}`);
  console.log("Source: postman.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

