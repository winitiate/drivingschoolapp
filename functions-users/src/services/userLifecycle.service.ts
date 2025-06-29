// functions-users\src\services\userLifecycle.service.ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth }                  from "firebase-admin/auth";
import {
  SetUserLifecycleInput,
  SetUserLifecycleResult,
} from "../types/userLifecycle.types";

/* Notes are stored per-location so an account can be banned in one place
   while remaining active elsewhere. */
interface Note {
  type : "banned" | "deactivated";
  msg? : string;
  by   : string;
  at   : string;              // ISO string
}

export async function userLifecycleService(
  input: SetUserLifecycleInput,
  actorUid: string
): Promise<SetUserLifecycleResult> {

  if (input.uid === actorUid) {
    throw new Error("You cannot modify your own lifecycle state.");
  }

  const db   = getFirestore();
  const auth = getAuth();

  /* ---------- fetch profile ---------- */
  const userRef  = db.collection("users").doc(input.uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error("Target user not found.");

  const user = userSnap.data() as any;

  /* ---------- derive dynamic keys ---------- */
  const map = {
    client         : "clientLocationIds",
    serviceProvider: "providerLocationIds",
    locationAdmin  : "adminLocationIds",
    businessOwner  : "ownedBusinessIds",
  } as const;

  const relKey      = map[input.role];                       // array<string>
  const bannedKey   = `banned${relKey[0].toUpperCase()}${relKey.slice(1)}`;
  const deactKey    = `deactivated${relKey[0].toUpperCase()}${relKey.slice(1)}`;
  const notesKey    = "lifecycleNotes";                      // sparse map

  const relArr    = Array.isArray(user[relKey])   ? [...user[relKey]]   : [];
  const bannedArr = Array.isArray(user[bannedKey])? [...user[bannedKey]]: [];
  const deactArr  = Array.isArray(user[deactKey]) ? [...user[deactKey]] : [];

  /* ---------- mutate arrays per action ---------- */
  const note: Note = { by: actorUid, at: new Date().toISOString(),
                       type: input.action === "ban" ? "banned" : "deactivated",
                       msg : input.msg };

  switch (input.action) {
    case "ban":
      if (!bannedArr.includes(input.locationId)) bannedArr.push(input.locationId);
      while (deactArr.includes(input.locationId)) {
        deactArr.splice(deactArr.indexOf(input.locationId), 1);
      }
      break;

    case "deactivate":
      if (!deactArr.includes(input.locationId)) deactArr.push(input.locationId);
      while (bannedArr.includes(input.locationId)) {
        bannedArr.splice(bannedArr.indexOf(input.locationId), 1);
      }
      break;

    case "reactivate":
      while (bannedArr.includes(input.locationId)) {
        bannedArr.splice(bannedArr.indexOf(input.locationId), 1);
      }
      while (deactArr.includes(input.locationId)) {
        deactArr.splice(deactArr.indexOf(input.locationId), 1);
      }
      break;

    case "delete":
      /* remove relationship entirely */
      while (relArr.includes(input.locationId)) {
        relArr.splice(relArr.indexOf(input.locationId), 1);
      }
      while (bannedArr.includes(input.locationId)) {
        bannedArr.splice(bannedArr.indexOf(input.locationId), 1);
      }
      while (deactArr.includes(input.locationId)) {
        deactArr.splice(deactArr.indexOf(input.locationId), 1);
      }
      break;
  }

  /* ---------- build patch & write ---------- */
  const patch: Record<string, unknown> = {
    [relKey]   : relArr,
    [bannedKey]: bannedArr,
    [deactKey] : deactArr,
    updatedAt  : new Date(),
  };

  if (input.action === "ban" || input.action === "deactivate") {
    patch[`${notesKey}.${input.locationId}`] = note;
  } else {
    patch[`${notesKey}.${input.locationId}`] = FieldValue.delete();
  }

  await userRef.set(patch, { merge: true });

  /* ---------- optionally disable Auth user ---------- */
  if (
    input.action === "delete" &&
    !relArr.length && !bannedArr.length && !deactArr.length &&
    ["clientLocationIds","providerLocationIds","adminLocationIds","ownedBusinessIds"]
      .every(k => (user[k] as string[] | undefined)?.length === 0)
  ) {
    await auth.updateUser(input.uid, { disabled: true }).catch(() => {});
  }

  return { success: true };
}
