export const NO_MODE: number = -1;
export const OBJ_DETECTION_MODE: number = 0;
export const FACE_DETECTION_MODE: number = 1;
export const GESTURE_RECOGNITION_MODE: number = 2;

export const CONFIG_SLIDER_STEP: number = 0.2;

export const VISION_URL: string =
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export type Interface = "CPU" | "GPU";
export const DELEGATE_GPU: Interface = "GPU";
export const DELEGATE_CPU: Interface = "CPU";

export type RunningMode = "IMAGE" | "VIDEO";
export const RUNNING_MODE_IMAGE: RunningMode = "IMAGE";
export const RUNNING_MODE_VIDEO: RunningMode = "VIDEO";

export const OBJECT_DETECTION_STR: string = "Object Detection";
export const FACE_DETECTION_STR: string = "Face Detection";
export const GESTURE_RECOGNITION_STR: string = "Gesture Recognition";

export const VIDEO_INPUT: string = "videoinput";

export type ModelLoadResult = {
    modelName: string;
    mode: number;
    loadResult: boolean;
};

export type VideoDeviceContext = {
    webcamList: MediaDeviceInfo[];
    webcamId: string | undefined;
    setWebcamId: React.Dispatch<React.SetStateAction<string | undefined>>;
};
