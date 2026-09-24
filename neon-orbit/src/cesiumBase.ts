// Must run before Cesium resolves any asset URL.
declare const __CESIUM_BASE__: string;
(window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = __CESIUM_BASE__;
export {};
