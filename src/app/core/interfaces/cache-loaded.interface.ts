interface CacheLoadState {
    [areaId: string]: {
        initialLoaded: boolean;
        fullyLoaded: boolean;
    };
}
