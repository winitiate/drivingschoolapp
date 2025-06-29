"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLifecycleService = void 0;
// functions-users\src\services\userLifecycle.service.ts
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
async function userLifecycleService(input, actorUid) {
    if (input.uid === actorUid) {
        throw new Error("You cannot modify your own lifecycle state.");
    }
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    /* ---------- fetch profile ---------- */
    const userRef = db.collection("users").doc(input.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists)
        throw new Error("Target user not found.");
    const user = userSnap.data();
    /* ---------- derive dynamic keys ---------- */
    const map = {
        client: "clientLocationIds",
        serviceProvider: "providerLocationIds",
        locationAdmin: "adminLocationIds",
        businessOwner: "ownedBusinessIds",
    };
    const relKey = map[input.role]; // array<string>
    const bannedKey = `banned${relKey[0].toUpperCase()}${relKey.slice(1)}`;
    const deactKey = `deactivated${relKey[0].toUpperCase()}${relKey.slice(1)}`;
    const notesKey = "lifecycleNotes"; // sparse map
    const relArr = Array.isArray(user[relKey]) ? [...user[relKey]] : [];
    const bannedArr = Array.isArray(user[bannedKey]) ? [...user[bannedKey]] : [];
    const deactArr = Array.isArray(user[deactKey]) ? [...user[deactKey]] : [];
    /* ---------- mutate arrays per action ---------- */
    const note = { by: actorUid, at: new Date().toISOString(),
        type: input.action === "ban" ? "banned" : "deactivated",
        msg: input.msg };
    switch (input.action) {
        case "ban":
            if (!bannedArr.includes(input.locationId))
                bannedArr.push(input.locationId);
            while (deactArr.includes(input.locationId)) {
                deactArr.splice(deactArr.indexOf(input.locationId), 1);
            }
            break;
        case "deactivate":
            if (!deactArr.includes(input.locationId))
                deactArr.push(input.locationId);
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
    const patch = {
        [relKey]: relArr,
        [bannedKey]: bannedArr,
        [deactKey]: deactArr,
        updatedAt: new Date(),
    };
    if (input.action === "ban" || input.action === "deactivate") {
        patch[`${notesKey}.${input.locationId}`] = note;
    }
    else {
        patch[`${notesKey}.${input.locationId}`] = firestore_1.FieldValue.delete();
    }
    await userRef.set(patch, { merge: true });
    /* ---------- optionally disable Auth user ---------- */
    if (input.action === "delete" &&
        !relArr.length && !bannedArr.length && !deactArr.length &&
        ["clientLocationIds", "providerLocationIds", "adminLocationIds", "ownedBusinessIds"]
            .every(k => { var _a; return ((_a = user[k]) === null || _a === void 0 ? void 0 : _a.length) === 0; })) {
        await auth.updateUser(input.uid, { disabled: true }).catch(() => { });
    }
    return { success: true };
}
exports.userLifecycleService = userLifecycleService;
//# sourceMappingURL=userLifecycle.service.js.map