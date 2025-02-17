'use strict';
import type {
  Value3D,
  ValueRotation,
  ShareableRef,
  LayoutAnimationBatchItem,
  IReanimatedModule,
  IWorkletsModule,
  WorkletFunction,
  ShadowNodeWrapper,
  StyleProps,
} from '../commonTypes';
import { checkCppVersion } from '../platform-specific/checkCppVersion';
import { jsVersion } from '../platform-specific/jsVersion';
import { isFabric, isWeb } from '../PlatformChecker';
import type React from 'react';
import { getShadowNodeWrapperFromRef } from '../fabricUtils';
import { ReanimatedTurboModule } from '../specs';
import { ReanimatedError } from '../errors';
import { WorkletsModule } from '../worklets';
import type { ReanimatedModuleProxy } from './reanimatedModuleProxy';
import type {
  NormalizedCSSTransitionConfig,
  NormalizedSingleCSSAnimationConfig,
  NormalizedSingleCSSAnimationSettings,
} from '../css/platform/native';

const IS_WEB = isWeb();

export function createNativeReanimatedModule(): IReanimatedModule {
  return new NativeReanimatedModule();
}

function assertSingleReanimatedInstance() {
  if (
    global._REANIMATED_VERSION_JS !== undefined &&
    global._REANIMATED_VERSION_JS !== jsVersion
  ) {
    throw new ReanimatedError(
      `Another instance of Reanimated was detected.
See \`https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#another-instance-of-reanimated-was-detected\` for more details. Previous: ${global._REANIMATED_VERSION_JS}, current: ${jsVersion}.`
    );
  }
}

class NativeReanimatedModule implements IReanimatedModule {
  /**
   * We keep the instance of `WorkletsModule` here to keep correct coupling of
   * the modules and initialization order.
   */
  #workletsModule: IWorkletsModule;
  #reanimatedModuleProxy: ReanimatedModuleProxy;

  constructor() {
    this.#workletsModule = WorkletsModule;
    // These checks have to split since version checking depend on the execution order
    if (__DEV__) {
      assertSingleReanimatedInstance();
    }
    global._REANIMATED_VERSION_JS = jsVersion;
    if (global.__reanimatedModuleProxy === undefined) {
      ReanimatedTurboModule?.installTurboModule();
    }
    if (global.__reanimatedModuleProxy === undefined) {
      throw new ReanimatedError(
        `Native part of Reanimated doesn't seem to be initialized.
See https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting#native-part-of-reanimated-doesnt-seem-to-be-initialized for more details.`
      );
    }
    if (!isFabric() && !IS_WEB) {
      throw new ReanimatedError(
        'Reanimated 4 supports only the React Native New Architecture and web.'
      );
    }
    if (__DEV__) {
      checkCppVersion();
    }
    this.#reanimatedModuleProxy = global.__reanimatedModuleProxy;
  }

  registerSensor(
    sensorType: number,
    interval: number,
    iosReferenceFrame: number,
    handler: ShareableRef<(data: Value3D | ValueRotation) => void>
  ) {
    return this.#reanimatedModuleProxy.registerSensor(
      sensorType,
      interval,
      iosReferenceFrame,
      handler
    );
  }

  unregisterSensor(sensorId: number) {
    return this.#reanimatedModuleProxy.unregisterSensor(sensorId);
  }

  registerEventHandler<T>(
    eventHandler: ShareableRef<T>,
    eventName: string,
    emitterReactTag: number
  ) {
    return this.#reanimatedModuleProxy.registerEventHandler(
      eventHandler,
      eventName,
      emitterReactTag
    );
  }

  unregisterEventHandler(id: number) {
    return this.#reanimatedModuleProxy.unregisterEventHandler(id);
  }

  getViewProp<T>(
    viewTag: number,
    propName: string,
    component: React.Component | undefined, // required on Fabric
    callback?: (result: T) => void
  ) {
    let shadowNodeWrapper;
    if (isFabric()) {
      shadowNodeWrapper = getShadowNodeWrapperFromRef(
        component as React.Component
      );
      return this.#reanimatedModuleProxy.getViewProp(
        shadowNodeWrapper,
        propName,
        callback
      );
    }

    return this.#reanimatedModuleProxy.getViewProp(viewTag, propName, callback);
  }

  configureLayoutAnimationBatch(
    layoutAnimationsBatch: LayoutAnimationBatchItem[]
  ) {
    this.#reanimatedModuleProxy.configureLayoutAnimationBatch(
      layoutAnimationsBatch
    );
  }

  setShouldAnimateExitingForTag(viewTag: number, shouldAnimate: boolean) {
    this.#reanimatedModuleProxy.setShouldAnimateExitingForTag(
      viewTag,
      shouldAnimate
    );
  }

  enableLayoutAnimations(flag: boolean) {
    this.#reanimatedModuleProxy.enableLayoutAnimations(flag);
  }

  configureProps(uiProps: string[], nativeProps: string[]) {
    this.#reanimatedModuleProxy.configureProps(uiProps, nativeProps);
  }

  subscribeForKeyboardEvents(
    handler: ShareableRef<WorkletFunction>,
    isStatusBarTranslucent: boolean,
    isNavigationBarTranslucent: boolean
  ) {
    return this.#reanimatedModuleProxy.subscribeForKeyboardEvents(
      handler,
      isStatusBarTranslucent,
      isNavigationBarTranslucent
    );
  }

  unsubscribeFromKeyboardEvents(listenerId: number) {
    this.#reanimatedModuleProxy.unsubscribeFromKeyboardEvents(listenerId);
  }

  setViewStyle(viewTag: number, style: StyleProps) {
    this.#reanimatedModuleProxy.setViewStyle(viewTag, style);
  }

  removeViewStyle(viewTag: number) {
    this.#reanimatedModuleProxy.removeViewStyle(viewTag);
  }

  registerCSSAnimations(
    shadowNodeWrapper: ShadowNodeWrapper,
    animationConfigs: NormalizedSingleCSSAnimationConfig[]
  ) {
    this.#reanimatedModuleProxy.registerCSSAnimations(
      shadowNodeWrapper,
      animationConfigs
    );
  }

  updateCSSAnimations(
    animationId: number,
    settingsUpdates: {
      index: number;
      settings: Partial<NormalizedSingleCSSAnimationSettings>;
    }[]
  ) {
    this.#reanimatedModuleProxy.updateCSSAnimations(
      animationId,
      settingsUpdates
    );
  }

  unregisterCSSAnimations(viewTag: number) {
    this.#reanimatedModuleProxy.unregisterCSSAnimations(viewTag);
  }

  registerCSSTransition(
    shadowNodeWrapper: ShadowNodeWrapper,
    transitionConfig: NormalizedCSSTransitionConfig
  ) {
    this.#reanimatedModuleProxy.registerCSSTransition(
      shadowNodeWrapper,
      transitionConfig
    );
  }

  updateCSSTransition(
    viewTag: number,
    configUpdates: Partial<NormalizedCSSTransitionConfig>
  ) {
    this.#reanimatedModuleProxy.updateCSSTransition(viewTag, configUpdates);
  }

  unregisterCSSTransition(viewTag: number) {
    this.#reanimatedModuleProxy.unregisterCSSTransition(viewTag);
  }
}
