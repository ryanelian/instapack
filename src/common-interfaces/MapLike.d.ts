/**
 * A simple strongly-typed key-value store.
 */
interface MapLikeObject<T> {
    [key: string]: T;
}
