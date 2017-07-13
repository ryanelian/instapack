export interface SampleModel {
    the: number;
    quick: boolean;
    brown: string;
    fox: string[];
    jumps: { [key: number]: string };   // Dictionary<int, string>
    lazy: [string, number];             // Tuple<string, int>
    dog: any;                           // Object
}
