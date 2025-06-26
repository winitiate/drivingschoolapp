/**
 * src/services/index.ts
 * --------------------------------------------------------------------------
 * Public “barrel” for all front-end service wrappers.
 *
 *     import { bookAppointment, cancelAppointment, createClient } from "../../services";
 *
 * Behind the scenes, we delegate to src/services/api/index.ts so that any
 * future sub-group only needs to register itself once.
 */

export * from "./api";
