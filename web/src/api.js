export async function getJson(path, { signal } = {}) {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function mutationJson(path, method, body, { signal } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal,
  });
  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new Error(
      payload?.detail ?? `${response.status} ${response.statusText}`,
    );
  }

  return payload;
}

export function putJson(path, body, options) {
  return mutationJson(path, "PUT", body, options);
}

export function postJson(path, body, options) {
  return mutationJson(path, "POST", body, options);
}

export function deleteJson(path, options) {
  return mutationJson(path, "DELETE", undefined, options);
}
