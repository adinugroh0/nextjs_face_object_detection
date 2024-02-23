import Drawing3d from "@/lib/Drawing3d";
import {
    DELEGATE_GPU,
    Interface,
    ModelLoadResult,
    OBJECT_DETECTION_STR,
    OBJ_DETECTION_MODE,
    RUNNING_MODE_VIDEO,
} from "@/utils/definitions";
import {
    BoundingBox,
    Category,
    Detection,
    ObjectDetector,
    ObjectDetectorOptions,
    ObjectDetectorResult,
} from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { Vector2 } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { RunningMode } from "../utils/definitions";

const ObjectDetection = (() => {
    const MODEL_URL: string =
        "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/latest/efficientdet_lite0.tflite";

    const CONFIG_OBJECT_MIN_RESULT_VALUE: number = 0;
    const CONFIG_OBJECT_MAX_RESULT_VALUE: number = 10;
    const CONFIG_OBJECT_MIN_SCORE_VALUE: number = 0;
    const CONFIG_OBJECT_MAX_SCORE_VALUE: number = 1;
    const CONFIG_OBJECT_DEFAULT_RESULT_SLIDER_STEP_VALUE: number = 1;
    const CONFIG_OBJECT_DEFAULT_SCORE_SLIDER_STEP_VALUE: number = 0.1;

    let displayNamesLocale: string = "en";
    let maxResults: number = 5;
    let scoreThreshold: number = 0.5;
    let runningMode: RunningMode = RUNNING_MODE_VIDEO;
    let delegate: Interface = DELEGATE_GPU;

    let objectDetector: ObjectDetector | null = null;
    let isUpdating: boolean = false;

    const initModel = async (vision: any): Promise<ModelLoadResult> => {
        const result: ModelLoadResult = {
            modelName: OBJECT_DETECTION_STR,
            mode: OBJ_DETECTION_MODE,
            loadResult: false,
        };

        try {
            if (vision) {
                const config: ObjectDetectorOptions = getConfig();

                objectDetector = await ObjectDetector.createFromOptions(
                    vision,
                    config
                );

                result.loadResult = true;
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            } else {
                console.log(error);
            }
        }

        return result;
    };

    const getConfig = (): ObjectDetectorOptions => {
        const config: ObjectDetectorOptions = {
            baseOptions: {
                modelAssetPath: MODEL_URL,
                delegate: delegate,
            },
            displayNamesLocale: displayNamesLocale,
            maxResults: maxResults,
            scoreThreshold: scoreThreshold,
            runningMode: runningMode,
        };

        return config;
    };

    const setRunningMode = (mode: RunningMode) => {
        runningMode = mode;
    };

    const setMaxResults = (max: number) => {
        maxResults = max;
    };

    const setScoreThreshold = (score: number) => {
        scoreThreshold = score;
    };

    const setInterfaceDelegate = (del: Interface) => {
        delegate = del;
    };

    const updateModelConfig = async () => {
        if (objectDetector) {
            isUpdating = true;
            console.log("interface:", delegate);
            await objectDetector.setOptions(getConfig());
            isUpdating = false;
        }
    };

    const isModelUpdating = (): boolean => {
        return isUpdating;
    };

    const detectObject = (
        video: HTMLVideoElement
    ): ObjectDetectorResult | null => {
        if (objectDetector) {
            try {
                const detection: ObjectDetectorResult =
                    objectDetector.detectForVideo(video, performance.now());

                return detection;
            } catch (error) {
                if (error instanceof Error) {
                    console.log(error.message);
                } else {
                    console.log(error);
                }
            }
        }
        return null;
    };

    const draw = (
        mirrored: boolean,
        detections: Detection[] | null | undefined,
        width: number,
        height: number
    ) => {
        if (detections) {
            Drawing3d.clearScene();
            const objGroup = new THREE.Object3D();
            detections.forEach((detected: Detection) => {
                if (detected.boundingBox) {
                    const box: BoundingBox = detected.boundingBox;
                    const category: Category = detected.categories.reduce(
                        (maxScoreCat, current) => {
                            if (maxScoreCat.score < current.score) {
                                return current;
                            }

                            return maxScoreCat;
                        }
                    );

                    let points: Vector2[] = [];

                    if (mirrored) {
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraRight() - box.originX,
                                Drawing3d.getCameraTop() - box.originY
                            )
                        );
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraRight() -
                                    box.originX -
                                    box.width,
                                Drawing3d.getCameraTop() - box.originY
                            )
                        );
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraRight() -
                                    box.originX -
                                    box.width,
                                Drawing3d.getCameraTop() -
                                    box.originY -
                                    box.height
                            )
                        );
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraRight() - box.originX,
                                Drawing3d.getCameraTop() -
                                    box.originY -
                                    box.height
                            )
                        );
                    } else {
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraLeft() + box.originX,
                                Drawing3d.getCameraTop() - box.originY
                            )
                        );
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraLeft() +
                                    box.originX +
                                    box.width,
                                Drawing3d.getCameraTop() - box.originY
                            )
                        );
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraLeft() +
                                    box.originX +
                                    box.width,
                                Drawing3d.getCameraTop() -
                                    box.originY -
                                    box.height
                            )
                        );
                        points.push(
                            new THREE.Vector2(
                                Drawing3d.getCameraLeft() + box.originX,
                                Drawing3d.getCameraTop() -
                                    box.originY -
                                    box.height
                            )
                        );
                    }
                    const bufferGeo = new THREE.BufferGeometry().setFromPoints(
                        points
                    );
                    bufferGeo.setIndex([0, 1, 2, 3, 0]);

                    const unindexd = bufferGeo.toNonIndexed();
                    const geo = new LineGeometry().setPositions(
                        unindexd.getAttribute("position").array as Float32Array
                    );
                    const material = new LineMaterial({
                        color:
                            category.categoryName === "person"
                                ? "#FF0F0F"
                                : "#00B612",
                        linewidth: 0.008,
                    });

                    const line = new Line2(geo, material);
                    objGroup.add(line);

                    // Add text
                    const label = Drawing3d.createLabel(
                        category.categoryName,
                        category.score,
                        width,
                        height,
                        mirrored,
                        box
                    );

                    if (label) {
                        objGroup.add(label);
                    }
                }
            });
            Drawing3d.addToScene(objGroup);
            Drawing3d.render();
        }
    };

    return {
        CONFIG_OBJECT_MIN_RESULT_VALUE,
        CONFIG_OBJECT_MAX_RESULT_VALUE,
        CONFIG_OBJECT_MIN_SCORE_VALUE,
        CONFIG_OBJECT_MAX_SCORE_VALUE,
        CONFIG_OBJECT_DEFAULT_RESULT_SLIDER_STEP_VALUE,
        CONFIG_OBJECT_DEFAULT_SCORE_SLIDER_STEP_VALUE,
        initModel,
        detectObject,
        draw,
        getConfig,
        setInterfaceDelegate,
        setMaxResults,
        setScoreThreshold,
        setRunningMode,
        updateModelConfig,
        isModelUpdating,
    };
})();

export default ObjectDetection;
