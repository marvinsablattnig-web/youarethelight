import { createClient } from "tinacms/dist/client";
import { queries } from "./types.js";
export const client = createClient({ url: '/api/tina/gql', token: 'undefined', queries,  });
export default client;
  