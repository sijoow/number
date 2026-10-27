// 생성된 LauncherActivity.java 에 덧대기 — build.cjs 가 프로젝트를 만든 뒤 부른다.
// ① 카메라 자리까지 그리기(5판, 2026-10-21): androidbrowserhelper 2.7.4 는 DISPLAY_MODE=immersive 를 ImmersiveMode(false, 0) —
//    cutout 기본값으로 넘겨 카메라 쪽에 흰 띠가 남았다. 브라우저에 넘기기 직전에 SHORT_EDGES 로 바꿔 끼운다.
// ② 앱 엔진은 크롬으로(6판, 2026-10-21): 사장님 폰은 기본 브라우저인 삼성 인터넷 30 이 앱을 띄웠고(설정 > 화면 진단),
//    삼성 인터넷은 ①을 무시해 띠가 그대로였다. 크롬이 있고 TWA 를 하면 크롬으로, 없으면 원래대로(기본 브라우저) 고른다.
// (한글나라) 화면 방향은 앱 안 '화면 보기' 설정이 screen.orientation.lock 으로 정한다 — 보이스동화의 태블릿 가로 고정은 뺐다.
const fs = require("fs");
module.exports = function patchLauncher(file) {
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES")) return;
  const imports = [
    "import android.content.Intent;",
    "import android.content.pm.PackageManager;",
    "import android.content.pm.ResolveInfo;",
    "import android.view.WindowManager;",
    "import androidx.browser.customtabs.CustomTabsCallback;",
    "import androidx.browser.customtabs.CustomTabsService;",
    "import androidx.browser.trusted.TrustedWebActivityDisplayMode;",
    "import androidx.browser.trusted.TrustedWebActivityIntentBuilder;",
    "import com.google.androidbrowserhelper.trusted.LauncherActivityMetadata;",
    "import com.google.androidbrowserhelper.trusted.SessionStore;",
    "import com.google.androidbrowserhelper.trusted.SharedPreferencesTokenStore;",
    "import com.google.androidbrowserhelper.trusted.TwaLauncher;",
    "import com.google.androidbrowserhelper.trusted.splashscreens.SplashScreenStrategy;",
  ].join("\n");
  s = s.replace("import android.os.Bundle;", "import android.os.Bundle;\n" + imports);
  const method = `
    private static final String CHROME = "com.android.chrome";

    /**
     * 앱을 띄울 브라우저 — 크롬이 깔려 있고 켜져 있고 TWA 를 하면 크롬, 아니면 null(androidbrowserhelper 가 기본 브라우저로 고른다).
     * 삼성 인터넷은 카메라 자리 설정을 무시해 흰 띠가 남았다(2026-10-21 화면 진단).
     */
    private String pickBrowser() {
        String fixed = LauncherActivityMetadata.parse(this).launchingBrowser;
        if (fixed != null) return fixed;
        Intent probe = new Intent(CustomTabsService.ACTION_CUSTOM_TABS_CONNECTION).setPackage(CHROME);
        for (ResolveInfo info : getPackageManager().queryIntentServices(probe, PackageManager.GET_RESOLVED_FILTER)) {
            if (info.filter != null && info.filter.hasCategory(CustomTabsService.TRUSTED_WEB_ACTIVITY_CATEGORY)) {
                return CHROME;
            }
        }
        return null;
    }

    /**
     * 몰입 화면을 카메라 자리까지 — 브라우저에 넘기기 직전에 cutout 을 SHORT_EDGES 로 바꿔 끼운다(2026-10-21).
     * 나머지는 androidbrowserhelper 의 createTwaLauncher 와 같다(세션·토큰 저장소). 브라우저는 pickBrowser.
     */
    @Override
    protected TwaLauncher createTwaLauncher() {
        return new TwaLauncher(this, pickBrowser(),
                SessionStore.makeSessionId(getTaskId()), new SharedPreferencesTokenStore(this)) {
            @Override
            public void launch(TrustedWebActivityIntentBuilder twaBuilder, CustomTabsCallback customTabsCallback,
                    SplashScreenStrategy splashScreenStrategy, Runnable completionCallback,
                    TwaLauncher.FallbackStrategy fallbackStrategy) {
                twaBuilder.setDisplayMode(new TrustedWebActivityDisplayMode.ImmersiveMode(false,
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES));
                super.launch(twaBuilder, customTabsCallback, splashScreenStrategy, completionCallback, fallbackStrategy);
            }
        };
    }
`;
  const at = s.lastIndexOf("}");
  s = s.slice(0, at) + method + "}\n";
  fs.writeFileSync(file, s);
  const out = fs.readFileSync(file, "utf8");
  if (!out.includes("pickBrowser()") || !out.includes("SHORT_EDGES")) throw new Error("LauncherActivity 덧대기 실패");
};
