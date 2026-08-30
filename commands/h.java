package socialmedia.app.studio;

import android.Manifest;
import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.ActivityManager;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.provider.MediaStore;
import android.provider.Settings;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.SslErrorHandler;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationCompat;

import java.io.File;
import java.io.IOException;
import java.math.BigInteger;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Objects;

import com.onesignal.OneSignal;
import com.onesignal.Continue;
import socialmedia.app.studio.StudiosocialConfig;

public class MainActivity extends AppCompatActivity {

    //Permission variables
    static boolean StudiosocialApp_JSCRIPT = StudiosocialConfig.StudiosocialApp_JSCRIPT;
    static boolean StudiosocialApp_FUPLOAD = StudiosocialConfig.StudiosocialApp_FUPLOAD;
    static boolean StudiosocialApp_CAMUPLOAD = StudiosocialConfig.StudiosocialApp_CAMUPLOAD;
    static boolean StudiosocialApp_ONLYCAM = StudiosocialConfig.StudiosocialApp_ONLYCAM;
    static boolean StudiosocialApp_MULFILE = StudiosocialConfig.StudiosocialApp_MULFILE;
    static boolean StudiosocialApp_LOCATION = StudiosocialConfig.StudiosocialApp_LOCATION;
    static boolean StudiosocialApp_RATINGS = StudiosocialConfig.StudiosocialApp_RATINGS;
    static boolean StudiosocialApp_PULLFRESH = StudiosocialConfig.StudiosocialApp_PULLFRESH;
    static boolean StudiosocialApp_PBAR = StudiosocialConfig.StudiosocialApp_PBAR;
    static boolean StudiosocialApp_ZOOM = StudiosocialConfig.StudiosocialApp_ZOOM;
    static boolean StudiosocialApp_SFORM = StudiosocialConfig.StudiosocialApp_SFORM;
    static boolean StudiosocialApp_OFFLINE = StudiosocialConfig.StudiosocialApp_OFFLINE;
    static boolean StudiosocialApp_EXTURL = StudiosocialConfig.StudiosocialApp_EXTURL;

    //Security variables
    static boolean StudiosocialApp_CERT_VERIFICATION = StudiosocialConfig.StudiosocialApp_CERT_VERIFICATION;

    //Configuration variables
    private static String Studiosocial_URL = StudiosocialConfig.Studiosocial_URL;
    private String CURR_URL = Studiosocial_URL;

    private String oneSignalUserID;

    private static String Studiosocial_F_TYPE = StudiosocialConfig.Studiosocial_F_TYPE;

    private static String Studiosocial_ONESIGNAL_APP_ID = StudiosocialConfig.Studiosocial_ONESIGNAL_APP_ID;

    public static String ASWV_HOST = aswm_host(Studiosocial_URL);

    //Careful with these variable names if altering
    WebView swvp_view;
    ProgressBar swvp_progress;
    TextView swvp_loading_text;
    NotificationManager swvp_notification;
    Notification swvp_notification_new;

    private String swvp_cam_message;
    private ValueCallback<Uri> swvp_file_message;
    private ValueCallback<Uri[]> swvp_file_path;
    private final static int swvp_file_req = 1;

    private final static int loc_perm = 1;
    private final static int file_perm = 2;

    private SecureRandom random = new SecureRandom();

    private static final String TAG = MainActivity.class.getSimpleName();

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(getResources().getColor(R.color.colorPrimary));
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK) {
                if (requestCode == swvp_file_req) {
                    if (null == swvp_file_path) {
                        return;
                    }
                    if (intent == null || intent.getData() == null) {
                        if (swvp_cam_message != null) {
                            results = new Uri[]{Uri.parse(swvp_cam_message)};
                        }
                    } else {
                        String dataString = intent.getDataString();
                        if (dataString != null) {
                            results = new Uri[]{Uri.parse(dataString)};
                        } else {
                            if (StudiosocialApp_MULFILE) {
                                if (intent.getClipData() != null) {
                                    final int numSelectedFiles = intent.getClipData().getItemCount();
                                    results = new Uri[numSelectedFiles];
                                    for (int i = 0; i < numSelectedFiles; i++) {
                                        results[i] = intent.getClipData().getItemAt(i).getUri();
                                    }
                                }
                            }
                        }
                    }
                }
            }
            swvp_file_path.onReceiveValue(results);
            swvp_file_path = null;
        } else {
            if (requestCode == swvp_file_req) {
                if (null == swvp_file_message) return;
                Uri result = intent == null || resultCode != RESULT_OK ? null : intent.getData();
                swvp_file_message.onReceiveValue(result);
                swvp_file_message = null;
            }
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "WrongViewCast"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // OneSignal Initialization
        if (!Objects.equals(Studiosocial_ONESIGNAL_APP_ID, "")) {
            OneSignal.initWithContext(this, Studiosocial_ONESIGNAL_APP_ID);

            // requestPermission will show the native Android notification permission prompt.
            // NOTE: It's recommended to use a OneSignal In-App Message to prompt instead.
            OneSignal.getNotifications().requestPermission(false, Continue.none());

            // Get OneSignal user ID
            oneSignalUserID = OneSignal.getUser().getPushSubscription().getId();
        }

        Intent intent = getIntent();
        String action = intent.getAction();
        if (action == null) {
            //Prevent the app from being started again when it is still alive in the background
            if (!isTaskRoot()) {
                finish();
                return;
            }
        }

        setContentView(R.layout.activity_main);
        swvp_view = findViewById(R.id.msw_view);
        swvp_view.getSettings().setJavaScriptEnabled(true);

        final SwipeRefreshLayout pullfresh = findViewById(R.id.pullfresh);
        if (StudiosocialApp_PULLFRESH) {
            pullfresh.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
                @Override
                public void onRefresh() {
                    pull_fresh();
                    pullfresh.setRefreshing(false);
                }
            });
            swvp_view.getViewTreeObserver().addOnScrollChangedListener(new ViewTreeObserver.OnScrollChangedListener() {
                @Override
                public void onScrollChanged() {
                    if (swvp_view.getScrollY() == 0) {
                        pullfresh.setEnabled(true);
                    } else {
                        pullfresh.setEnabled(false);
                    }
                }
            });
        } else {
            pullfresh.setRefreshing(false);
            pullfresh.setEnabled(false);
        }

        if (StudiosocialApp_PBAR) {
            swvp_progress = findViewById(R.id.msw_progress);
        } else {
            findViewById(R.id.msw_progress).setVisibility(View.GONE);
        }
        swvp_loading_text = findViewById(R.id.msw_loading_text);
        Handler handler = new Handler();

        //Launching app rating request
        if (StudiosocialApp_RATINGS) {
            handler.postDelayed(new Runnable() {
                public void run() {
                    get_rating();
                }
            }, 1000 * 60); //running request after few moments
        }

        //Getting basic device information
        get_info();

        //Getting GPS location of device if given permission
        get_location();

        //Webview settings; defaults are customized for best performance
        WebSettings webSettings = swvp_view.getSettings();
        swvp_view.getSettings().setUserAgentString("StudiosocialAndroid");
        swvp_view.getSettings().setMediaPlaybackRequiresUserGesture(false);

        if (!StudiosocialApp_OFFLINE) {
            webSettings.setJavaScriptEnabled(StudiosocialApp_JSCRIPT);
        }
        webSettings.setSaveFormData(StudiosocialApp_SFORM);
        webSettings.setSupportZoom(StudiosocialApp_ZOOM);
        webSettings.setGeolocationEnabled(StudiosocialApp_LOCATION);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setDomStorageEnabled(true);

        swvp_view.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                return true;
            }
        });
        swvp_view.setHapticFeedbackEnabled(false);

        swvp_view.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimeType);
                String cookies = CookieManager.getInstance().getCookie(url);
                request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription(getString(R.string.dl_downloading));
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimeType));
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                assert dm != null;
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), getString(R.string.dl_downloading2), Toast.LENGTH_LONG).show();
            }
        });

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().setStatusBarColor(getResources().getColor(R.color.colorPrimaryDark));
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        swvp_view.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        swvp_view.setVerticalScrollBarEnabled(false);
        swvp_view.setWebViewClient(new Callback());

        //Rendering the default URL
        aswm_view(Studiosocial_URL, false);

        //Get Cam & Mic & location permissions
        if (!check_permission(1) || !check_permission(3) || !check_permission(4)) {
            //Cam & Mic & location permissions not granted so request them
            ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO}, 20);
        }

        swvp_view.setWebChromeClient(new WebChromeClient() {
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            //Handling input[type="file"]
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (check_permission(3)) {
                    if (StudiosocialApp_FUPLOAD) {
                        if (swvp_file_path != null) {
                            swvp_file_path.onReceiveValue(null);
                        }
                        swvp_file_path = filePathCallback;
                        Intent takePictureIntent = null;
                        if (StudiosocialApp_CAMUPLOAD) {
                            takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                            if (takePictureIntent.resolveActivity(MainActivity.this.getPackageManager()) != null) {
                                File photoFile = null;
                                Uri photoURI = null;
                                try {
                                    photoFile = create_image();
                                    photoURI = FileProvider.getUriForFile(MainActivity.this, MainActivity.this.getPackageName() + ".provider", photoFile);
                                } catch (IOException ex) {
                                    Log.e(TAG, "Image file creation failed", ex);
                                }
                                if (photoURI != null) {
                                    swvp_cam_message = "file:" + photoFile.getAbsolutePath();
                                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                                } else {
                                    takePictureIntent = null;
                                }
                            }
                        }
                        Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                        if (!StudiosocialApp_ONLYCAM) {
                            contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                            contentSelectionIntent.setType(Studiosocial_F_TYPE);
                            if (StudiosocialApp_MULFILE) {
                                contentSelectionIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                            }
                        }
                        Intent[] intentArray;
                        if (takePictureIntent != null) {
                            intentArray = new Intent[]{takePictureIntent};
                        } else {
                            intentArray = new Intent[0];
                        }

                        Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                        chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                        chooserIntent.putExtra(Intent.EXTRA_TITLE, getString(R.string.fl_chooser));
                        chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);
                        startActivityForResult(chooserIntent, swvp_file_req);
                    }
                    return true;
                } else {
                    get_file();
                    return false;
                }
            }

            //Getting studio rendering progress
            @Override
            public void onProgressChanged(WebView view, int p) {
                if (StudiosocialApp_PBAR) {
                    swvp_progress.setProgress(p);
                    if (p == 100) {
                        swvp_progress.setProgress(0);
                    }
                }
            }
        });
        if (getIntent().getData() != null) {
            String path = getIntent().getDataString();
            if (path != null && path.startsWith("socialmedia://")) {
                path = path.replace("socialmedia://", "https://");
            }
            aswm_view(path, false);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        swvp_view.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        swvp_view.onResume();
        //Coloring the "recent apps" tab header; doing it onResume, as an insurance
        if (Build.VERSION.SDK_INT >= 23) {
            Bitmap bm = BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher);
            ActivityManager.TaskDescription taskDesc;
            taskDesc = new ActivityManager.TaskDescription(getString(R.string.app_name), bm, getColor(R.color.colorPrimary));
            MainActivity.this.setTaskDescription(taskDesc);
        }
        get_location();
    }

    //Setting activity layout visibility
    private class Callback extends WebViewClient {
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            get_location();
        }

        public void onPageFinished(WebView view, String url) {
            findViewById(R.id.msw_welcome).setVisibility(View.GONE);
            findViewById(R.id.msw_view).setVisibility(View.VISIBLE);

            // Disable pull-to-refresh for the reels page
            SwipeRefreshLayout pullfresh = findViewById(R.id.pullfresh);
            if (pullfresh != null) {
                pullfresh.setEnabled(!url.contains("reels"));
            }

            // Inject JavaScript to save the OneSignal user ID after the page has loaded
            if (oneSignalUserID != null) {
                swvp_view.loadUrl("javascript:saveAndroidOneSignalUserId('" + oneSignalUserID + "')");
            }
        }

        //For android below API 23
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            Toast.makeText(getApplicationContext(), getString(R.string.went_wrong), Toast.LENGTH_SHORT).show();
            aswm_view("file:///android_asset/error.html", false);
        }

        //Overriding studio URLs
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            CURR_URL = url;
            return url_actions(view, url);
        }

        //Overriding studio URLs for API 23+ [suggested by github.com/JakePou]
        @TargetApi(Build.VERSION_CODES.N)
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            CURR_URL = request.getUrl().toString()