package ps.kahraba.calc;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.Base64;

public class MainActivity extends Activity {
    private static final int REQUEST_EXPORT = 1001;
    private static final int REQUEST_IMPORT = 1002;

    private WebView webView;
    private String pendingExport = "";
    private final FileStore store = new FileStore();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFFEFEAE2);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setSupportZoom(false);
        webView.setWebViewClient(new WebViewClient());
        webView.addJavascriptInterface(new LedgerBridge(), "AndroidLedger");
        setContentView(webView);
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        if (requestCode == REQUEST_EXPORT) {
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                if (out != null) out.write(pendingExport.getBytes(StandardCharsets.UTF_8));
            } catch (Exception ignored) {
                // The system picker already closed; the in-app data is unchanged.
            }
            return;
        }
        if (requestCode == REQUEST_IMPORT) {
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in == null) return;
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                int read;
                while ((read = in.read(chunk)) != -1) buffer.write(chunk, 0, read);
                deliverImport(buffer.toString(StandardCharsets.UTF_8.name()));
            } catch (Exception ignored) {
                deliverImport("");
            }
        }
    }

    private void deliverImport(String json) {
        String encoded = Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        String script =
                "window.__electricityImport&&window.__electricityImport("
                        + "new TextDecoder().decode(Uint8Array.from(atob('"
                        + encoded
                        + "'),function(c){return c.charCodeAt(0)})))";
        webView.evaluateJavascript(script, null);
    }

    private final class LedgerBridge {
        @JavascriptInterface
        public String storageLoad() {
            return store.read(getFilesDir());
        }

        @JavascriptInterface
        public void storageSave(String json) {
            store.write(getFilesDir(), json == null ? "" : json);
        }

        @JavascriptInterface
        public void shareText(String text) {
            final String payload = text == null ? "" : text;
            runOnUiThread(
                    () -> {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType("text/plain");
                        send.putExtra(Intent.EXTRA_TEXT, payload);
                        startActivity(Intent.createChooser(send, "مشاركة الفاتورة"));
                    });
        }

        @JavascriptInterface
        public void copyText(String text) {
            final String payload = text == null ? "" : text;
            runOnUiThread(
                    () -> {
                        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);
                        if (clipboard != null) {
                            clipboard.setPrimaryClip(ClipData.newPlainText("فاتورة الكهرباء", payload));
                        }
                    });
        }

        @JavascriptInterface
        public void exportJson(String filename, String content) {
            pendingExport = content == null ? "" : content;
            final String name = filename == null || filename.isEmpty() ? "electricity-backup.json" : filename;
            runOnUiThread(
                    () -> {
                        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType("application/json");
                        intent.putExtra(Intent.EXTRA_TITLE, name);
                        startActivityForResult(intent, REQUEST_EXPORT);
                    });
        }

        @JavascriptInterface
        public void importJson() {
            runOnUiThread(
                    () -> {
                        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                        intent.addCategory(Intent.CATEGORY_OPENABLE);
                        intent.setType("application/json");
                        startActivityForResult(intent, REQUEST_IMPORT);
                    });
        }
    }

    static final class FileStore {
        String read(File dir) {
            File main = new File(dir, "ledger.json");
            File tmp = new File(dir, "ledger.json.tmp");
            String mainText = readFile(main);
            if (!mainText.isEmpty()) return mainText;
            return readFile(tmp);
        }

        void write(File dir, String json) {
            File main = new File(dir, "ledger.json");
            File tmp = new File(dir, "ledger.json.tmp");
            try {
                Files.write(tmp.toPath(), json.getBytes(StandardCharsets.UTF_8));
                Files.move(
                        tmp.toPath(),
                        main.toPath(),
                        StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (Exception atomicFailed) {
                try {
                    Files.write(main.toPath(), json.getBytes(StandardCharsets.UTF_8));
                    Files.deleteIfExists(tmp.toPath());
                } catch (Exception ignored) {
                    // Keep the previous file if both writes fail.
                }
            }
        }

        private String readFile(File file) {
            try {
                if (!file.exists()) return "";
                return new String(Files.readAllBytes(file.toPath()), StandardCharsets.UTF_8);
            } catch (Exception ignored) {
                return "";
            }
        }
    }
}
