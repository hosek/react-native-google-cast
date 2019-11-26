package com.reactnative.googlecast.api;

import android.content.Intent;
import android.os.Handler;
import android.util.Log;
import android.view.View;

import androidx.annotation.Nullable;
import androidx.mediarouter.app.MediaRouteButton;
import androidx.mediarouter.media.MediaRouter;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.annotations.VisibleForTesting;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.IntroductoryOverlay;
import com.google.android.gms.cast.framework.SessionManager;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.reactnative.googlecast.components.GoogleCastExpandedControlsActivity;
import com.reactnative.googlecast.components.RNGoogleCastButtonManager;
import com.reactnative.googlecast.types.RNGCCastState;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNGCCastContext
    extends ReactContextBaseJavaModule implements LifecycleEventListener {

  @VisibleForTesting public static final String REACT_CLASS = "RNGCCastContext";

  public static final String SESSION_STARTING = "GoogleCast:SessionStarting";
  public static final String SESSION_STARTED = "GoogleCast:SessionStarted";
  public static final String SESSION_START_FAILED =
      "GoogleCast:SessionStartFailed";
  public static final String SESSION_SUSPENDED = "GoogleCast:SessionSuspended";
  public static final String SESSION_RESUMING = "GoogleCast:SessionResuming";
  public static final String SESSION_RESUMED = "GoogleCast:SessionResumed";
  public static final String SESSION_ENDING = "GoogleCast:SessionEnding";
  public static final String SESSION_ENDED = "GoogleCast:SessionEnded";

  private SessionManagerListener<CastSession> mSessionManagerListener;

  public RNGCCastContext(ReactApplicationContext reactContext) {
    super(reactContext);
    reactContext.addLifecycleEventListener(this);
    setupCastListener();
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put("SESSION_STARTING", SESSION_STARTING);
    constants.put("SESSION_STARTED", SESSION_STARTED);
    constants.put("SESSION_START_FAILED", SESSION_START_FAILED);
    constants.put("SESSION_SUSPENDED", SESSION_SUSPENDED);
    constants.put("SESSION_RESUMING", SESSION_RESUMING);
    constants.put("SESSION_RESUMED", SESSION_RESUMED);
    constants.put("SESSION_ENDING", SESSION_ENDING);
    constants.put("SESSION_ENDED", SESSION_ENDED);

    return constants;
  }

  public void sendEvent(String eventName) {
    this.sendEvent(eventName, null);
  }

  public void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext()
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  @ReactMethod
  public void getCastState(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        CastContext castContext =
            CastContext.getSharedInstance(getReactApplicationContext());
        promise.resolve(RNGCCastState.toJson(castContext.getCastState()));
      }
    });
  }

  @ReactMethod
  public void endSession(final boolean stopCasting, final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager =
            CastContext.getSharedInstance(getReactApplicationContext())
                .getSessionManager();
        sessionManager.endCurrentSession(stopCasting);
        promise.resolve(true);
      }
    });
  }

  @ReactMethod
  public void showCastDialog(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouteButton button = RNGoogleCastButtonManager.getCurrent();
        if (button != null) {
          button.performClick();
          promise.resolve(true);
        } else {
          promise.resolve(false);
        }
      }
    });
  }

  @ReactMethod
  public void getRoutes(final Promise promise) {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        MediaRouter mr = MediaRouter.getInstance(getReactApplicationContext());
        WritableArray devicesList = Arguments.createArray();
        try {
            for (MediaRouter.RouteInfo existingChromecast : mr.getRoutes()) {
              WritableMap singleDevice = Arguments.createMap();
              singleDevice.putString("id", existingChromecast.getId());
              singleDevice.putString("name", existingChromecast.getName());
              devicesList.pushMap(singleDevice);
          }
          promise.resolve(devicesList);
        } catch (IllegalViewOperationException e) {
          promise.reject(e);
        }
      }
    });
  }

  @ReactMethod
  public void selectRoute(final String id,final Promise promise) {

    try {
          getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
              MediaRouter mr = MediaRouter.getInstance(getReactApplicationContext());
              for (final MediaRouter.RouteInfo existingChromecast : mr.getRoutes())
              {
                if(existingChromecast.getId().contentEquals(id))
                {
                  mr.selectRoute(existingChromecast);
                  promise.resolve(true);
                }
              }
        }
      });
    }
    catch (IllegalViewOperationException e) {
      promise.reject(e);
  }

  }

  @ReactMethod
  public void showExpandedControls() {
    ReactApplicationContext context = getReactApplicationContext();
    Intent intent =
        new Intent(context, GoogleCastExpandedControlsActivity.class);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    context.startActivity(intent);
  }

  @ReactMethod
  public void showIntroductoryOverlay(final ReadableMap options, final Promise promise) {
    final
    MediaRouteButton button = RNGoogleCastButtonManager.getCurrent();

    if ((button != null) && button.getVisibility() == View.VISIBLE) {
      new Handler().post(new Runnable() {
        @Override
        public void run() {
          getReactApplicationContext().runOnUiQueueThread(new Runnable() {
            @Override
            public void run() {
              IntroductoryOverlay.Builder builder = new IntroductoryOverlay.Builder(getCurrentActivity(), button);

              if (options.getBoolean("once")) {
                builder.setSingleTime();
              }

              builder.setOnOverlayDismissedListener(
                      new IntroductoryOverlay.OnOverlayDismissedListener() {
                        @Override
                        public void onOverlayDismissed() {
                          promise.resolve(true);
                        }
                      });

              IntroductoryOverlay overlay = builder.build();

              overlay.show();
            }
          });
        }
      });
    }
  }

  private void setupCastListener() {
    mSessionManagerListener = new RNGCSessionManagerListener(this);
  }

  @Override
  public void onHostResume() {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager =
            CastContext.getSharedInstance(getReactApplicationContext())
                .getSessionManager();
        sessionManager.addSessionManagerListener(mSessionManagerListener,
                                                 CastSession.class);
      }
    });
  }

  @Override
  public void onHostPause() {
    getReactApplicationContext().runOnUiQueueThread(new Runnable() {
      @Override
      public void run() {
        SessionManager sessionManager =
            CastContext.getSharedInstance(getReactApplicationContext())
                .getSessionManager();
        sessionManager.removeSessionManagerListener(mSessionManagerListener,
                                                    CastSession.class);
      }
    });
  }

  @Override
  public void onHostDestroy() {}

  public void runOnUiQueueThread(Runnable runnable) {
    getReactApplicationContext().runOnUiQueueThread(runnable);
  }
}
