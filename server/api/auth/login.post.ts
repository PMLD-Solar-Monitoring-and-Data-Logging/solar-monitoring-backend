// [POST] /api/auth/login username,password
// [GET] /api/auth/user
// [GET] /plugins/telemetry/DEVICE/<device_id>/values/attributes/SHARED_SCOPE?keys=relay
// [POST] /plugins/telemetry/DEVICE/<device_id>/attributes/SHARED_SCOPE
// [GET] /api/plugins/telemetry/DEVICE/<device_id>/values/timeseries?keys=voltage%2Ccurrent&startTs=1759865100272&endTs=1759865130272&interval=0&useStrictDataTypes=false

import getAccessToken from "~~/server/plugins/auth";

export default defineEventHandler(async (event) => {
    return getAccessToken();
});
