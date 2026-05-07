import { getMe } from "./api";

export async function getSessionUser() {
  try {
    const me = await getMe();
    return { me };
  } catch {
    return null;
  }
}
