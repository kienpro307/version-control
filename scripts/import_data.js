// Native fetch (Node 18+)
const API_URL = 'http://localhost:3000/api';
const API_KEY = 'mvm_sk_live_FobxzQGHr9FHiVH60XCNlpPjawt19oQ3';
const PROJECT_NAME = 'All Translate React Native';

const RAW_DATA = `
ver 14

- [x]  Sửa log lên databucket, đổi tên package thành package_id
- [x]  Fill đủ danh sách ad
- [x]  Remote config
- [x]  Sửa danh sách language theo list Anh → Tây Ban Nha, Bồ đào nha
- [x]  Làm app quay trở lại bản trước khi đẩy
- [x]  Sửa lại màn đang áp dụng ngôn ngữ thành popup
- [x]  Thêm luồng home trước rồi mới đến màn lang, màn home này chỉ là view để show giao diện thôi, không load quảng cáo
- [x]  Tích hợp AppsFlyer

- [x]  Hỏi về lỗi crash quyền
- [x]  Hỏi về dịch text đa luồng với hàm đệ quy của dịch file docs
- [x]  fix bug phần review
- [x]  Tối ưu open app, khi nào user quay lại app thì mới preload open app, thêm một màn “Đang quay lại app” ở giữa
- [x]  Open ad load high id, không được thì load inter, sau màn loading là hiện open ad được rồi
- [x]  Màn demo home dùng ngôn ngữ máy
- [x]  Bản mới scale thì giảm ad đi, remote config để tắt banner
- [x]  Thêm giới hạn số từ dịch docs

Ver 15

- [x]  Sửa lỗi quay lại màn trước mất ad
- [x]  Bỏ common, nếu k load được high thì load thường
- [x]  Thêm cơ chế load high
- [x]  Tối ưu preload native ad
- [x]  Thêm cơ chế bật tắt tiptrick cho high id

Ver 17

- [x]  Sửa lại thư viện react native admob trên git
- [x]  Không cho gợi ý hội thoại ở học ngôn ngữ nếu không có mạng
- [x]  Đổi firebaseTrackAds thành trackAd chung cho cả app
- [x]  Tích hợp nhiều mediation
- [x]  Sửa home_demo và onboard, tăng kích thước button ⇒ tăng tỉ lệ pass tutorial
- [x]  Bỏ dòng chữ có thể có quảng cáo ở màn splash nếu người dùng đã mua gói
- [x]  cool down time open app
- [x]  Thông báo thoát app
- [x]  Dispatch màn language
- [x]  Chặn preload OpenAd ở đầu app đối với người dùng premium bằng cách lưu vào asyncStorage
- [x]  Bỏ premium ở màn demo

Ver 18

- [x]  Chỉnh lại padding top ở text màn onboard + text ở màn onboard
- [x]  Sửa icon app

ver19

- [x]  Sửa lại nốt logic của của inter + cái placement Id
- [x]  Fix lỗi crash
- [x]  Làm cái map ngôn ngữ của android với app
- [x]  Log và logic dựa vào country chứ không đợi api

ver20

- [x]  high-inter
    - [x]  Tăng số lượng quảng cáo inter, thêm high inter
    - [x]  Check:
    - [x]  Dịch docs → inter
    - [x]  Mở app → high inter
    - [x]  Kiểm tra biến remote
- [x]  Thêm code mới của dịch docs
- [x]  Sửa lỗi location
- [x]  Sửa lỗi load quảng cáo unknown

ver21

- [x]  Bắt sự kiện người dùng click quảng cáo
    - [x]  Native
    - [x]  Banner
    - [x]  Inter
    - [x]  Open App
    - [x]  Reward
- [x]  thêm tia
- [x]  Thêm cơ chế lấy location từ remote config
- [x]  Thêm AB Test cơ chế preload open ad sau khi hiện CMP
- [x]  Thêm cơ chế nếu k pass màn language thì lưu vào cache để lần sau vào lại thì pass luôn
- [x]  Quảng cáo onboard để full không tip trick

Ver22

- [x]  Kiểm tra lại rate app, thêm cái rate theo số lần sử dụng tính năng dịch. Nếu số lần dịch quá 5, khi vào màn home sẽ hiện popup thông show rate
- [x]  Kiểm tra lại log inter và open, hiện gửi event show open nhưng lại log inter
- [x]  Thêm cơ chế ngã ở đâu đi tiếp ở đấy, chỉ cần làm cho onboard đầu, những cái sau không cần vì nếu thoát ra vào lại sẽ tự mất onboard rồi
- [x]  Kiểm tra lại logic lấy country, có một số cái không có country nhưng vẫn log

ver23

- [x]  Bỏ quảng cáo CTR thấp dưới 5%, translate document, natvie home
- [x]  Sửa lại rate app

ver24

- [x]  Màn onboard mới
- [x]  Localize
- [x]  Bắt người dùng ấn tiếp tục, không cho quay lại
- [x]  Load quảng cáo khi vào đến màn thứ 3, chỉnh remote config

ver 25

- [x]  Thêm nút mic
- [x]  Chặn không cho ấn next liên tục
- [x]  Cho interback vào tính năng mới preload

ver26

- [x]  Fix lỗi dịch pdf reduce noice
- [x]  Chặn không cho ấn mua gói liên tục
- [x]  Đổi thời gian chặn ấn next màn onboard từ 1s → 300 ms
- [x]  Thêm ab testing bỏ limit khi dịch file sample
    - [x]  Sửa logic không hiện popup khi dịch file sample
    - [x]  Đổi UI màn sample
- [x]  Rollback lại quảng cáo inter bản 26
- [x]  Bỏ button mic

ver27

- [x]  Chữ có thể có quảng cáo ở onboard cho nhỏ đi
- [x]  retry lại dịch camera tối đa 3 lần nếu ocr error
- [x]  log experiment group gồm cả NA
- [x]  Ưu tiên firebase location, sửa lại log chỗ mismatch bị sai

ver30

- [x]  Log AF campaign
- [x]  Sửa lại margin bottom text ở splash screen

ver 33

- [x]  Tích hợp thêm appsflyer theo yêu cầu của chị Thư

ver 34

- [x]  Sửa lại lấy country, không lấy theo device nữa, không gọi được api với remote thì trả về unknown
- [x]  Sửa lại remote config country name theo admob
- [x]  Gắn thêm campaing vào tất cả các log
- [x]  Sửa giao diện
    - [x]  Splash
        - [x]  Localize chữ ở splash
    - [x]  onboard
        - [x]  Làm lại logic quảng cáo, id quảng cáo
        - [x]  Thiết kế quảng cáo
    - [x]  animation
    - [x]  payment
    - [x]  Language
    - [x]  Cơ chế ấn vào quảng cáo thì sang màn tiếp theo

ver35

- [x]  Màn onboard
    - [x]  Quảng cáo nào không load được thì khi người dùng vuốt đến skip luôn
    - [x]  Bỏ màn feedback đi, màn payment thì để lần thứ 2 vào app mới hiện
    - [x]  Thêm quảng cáo inter khi người dùng ấn start, bật tắt được bằng remote config
    - [x]  Sửa lỗi tự nhiên hiện ra quảng cáo open app khi hết onboard
    - [x]  Onboard: Button Continue nên có icon mũi tên về bên phải chỉ hướng next.
- [x]  Payment
    - [x]  Chữ ở trên nút đăng ký khi kí tự dài quá thì bị nhảy
- [x]  Màn language
    - [x]  Bàn tay đang che mất nút, đổi hiệu ứng sao cho người dùng ấn được vào bàn tay
- [x]  Màn home
    - [x]  Khi người dùng mua gói thì hiển thị nút feed back để user khó hủy mua gói hơn
- [x]  Inter back bị lỗi quay lại cứ hiện đang quay lại app nma không có cái quảng cáo nào? (chưa tái hiện lại được)

ver 37

- [x]  màn language giảm hiệu ứng ở language để người dùng tập trung vào native ad hơn
- [x]  Thêm nhấp nháy nút next ở màn onboard đầu tiên khi không hiện quảng cáo full
- [x]  sửa lại màn language khi vào trong app
- [x]  Thêm nhấp nháy ở các màn mà tỉ lệ drop cao (native full,
- [x]  Quảng cáo native nhỏ ở màn onboard không nhấp nháy nữa
- [x]  Sửa image translation thành camera translation
- [x]  Thay màn onboard cuối ảnh many more features như bản cũ
- [x]  Thêm request noti ở màn splash
- [x]  Sửa bug dùng quảng cáo test

ver 42

- [x]  Sửa lại naviagate của text screen

ver 45

- [x]  Log tutorial skip, hành trình của người dùng khi đi đến màn nào
- [x]  Đồng nhất lại chều cao và kích thước của native ad
- [x]  Sửa lại cơ chế load ad của inter
- [x]  cho paging onboard sang trái
- [x]  load native ở màn home demo
- [x]  không cho naitve ad nháy nữa, load native ad từ màn 2
- [x]  load inter ở màn onboard cuối

ver 49

- [x]  AB test màn payment
- [x]  Fix bug không show quảng cáo native onboard 2 + I001
- [x]  Đo thời gian load ad của inter
- [x]  Sửa lại giao diện màn home
- [x]  Log doanh thu inter
- [x]  Log event cmp, ads init, firebase
- [x]  Thêm biến điều khiển khi nào thì load quảng cáo inter

ver 50

- [x]  Cải thiện show rate popup country bằng cách preload ở màn home
- [x]  Cải thiện show rate native feature bằng cách preload giảm đi (nếu ổn thì cho thêm high id)
- [x]  Log thời gian load inter của người dùng
- [x]  Cải thiện show rate inter bằng cách tăng timeout lên 7.5s
- [x]  Sửa lại màn payment
- [x]  Bỏ thanh bar dưới cùng ở màn splash đi
- [x]  Sửa lại luồng khi bypass
- [x]  phóng to icon history ở màn home

ver51

- [x]  Sửa lại payment + icon support

ver 52

- [x]  Sửa lại cho button native ad to hơn
- [x]  Thêm cơ chế bypass hoặc clear view như app ảnh
- [x]  Thêm cơ chế load inter back
    - [x]  1 Show inter-back
    - [x]  2 Show inter forward khi action chính
    - [x]  3 Show cả back + forward, chiều nào cũng show trong khoảng thời gian cooldown time
    - [x]  Remote preload inter back
- [x]  Không hiện native document translate khi đang dịch
- [x]  Thêm Native_Save_Document
- [x]  Thêm tip trick uninstall app
- [x]  Thêm cooldown time cho inter đầu app
- [x]  Kiểm tra lại log insight đã sửa lại country  code, UA campaign trước khi gửi
- [x]  Mỗi màn onboard là 1 placement riêng, có thể bật tắt
- [x]  log position ở track ads
- [x]  Khi app ở chế độ tắt first open ads thì không bật popup xin quyền
- [x]  Thêm ‘All’ cho cool down time open back và để 60s
- [x]  Thêm remote không hiện open back khi chưa xong tutorial
- [x]  Thêm remote cho collapsible banner
- [x]  Tắt inter rồi mới về màn home
- [x]  Thêm remote cho reverse button ở màn language

ver53

- [x]  Thêm logic close inter onboard thì mới cho vào home chứ không cho vào home luôn
- [x]  Fix lỗi open app (nếu có thể)
- [x]  Nâng cao chất lượng ảnh và làm lại giao diện khi disable ad ở màn onboard và language
- [x]  cool down time từ lúc đóng inter
- [x]  Tắt hiện quảng cáo khi dịch file
- [x]  Sửa lỗi dịch file
- [x]  Đổi list ad change thành JSON

ver54

- [x]  Cho chạy init ad song song
- [x]  Kiểm tra lại caption lúc mới mở app
- [x]  Sửa lại ad 2 high id ở màn onboard không show

Ver55/57

- [x]  quote daily
- [x]  Lỗi modal màn select ngôn ngữ
- [x]  Sửa kĩ phần log
- [x]  Log ấn camera ở vị trí nào

ver56/58

- [x]  Sửa lại log data bucket
- [x]  Up version android
    - [x]  classpath("com.android.tools.build:gradle:8.4.2")
    - [x]  yarn upgrade @react-native/gradle-plugin@latest
    - [x]  distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
    - [x]  https://github.com/facebook/react-native/issues/46069
    - [x]  fix public class ReactNativeApplicationEntryPoint {
    - [x]  Bubble dịch màn hình tương tác được
    - [x]  Thêm ở build gradle: implementation "org.jetbrains.kotlin:kotlin-reflect:$kotlin_version”
    - [x]  Sửa [proguard-rules.pro](http://proguard-rules.pro/), có một số code của native khi minify bị mất ảnh hưởng đến logic code.
    - [x]  Animation lắng nghe không chuyển động
- [x]  Up version billing
    - [x]  Nâng lên billing 7.1.1 , billing 8 bị crash
    - [x]  react native iap nâng lên version 12.16.4. Version 13.0.0 hàm getAvailablePurchase không trả về kết quả resolve dẫn đến lỗi

ver 59

- [x]  Fix crash lặt vặt (open app, NPE)
- [x]  Thêm tính năng phrase

ver 60

- [x]  Sửa padding ở item thứ 4 ở phrase detail khi mà không có quảng cáo

ver 61

- [x]  Bỏ icon delete app

ver 62

- [x]  Thay file sampe xịn
- [x]  fix crash splash screen
- [x]  thay màn chờ load ad

ver 65

- [x]  Hiển thị popup xin quyền lên sau khi CMP thành công
- [x]  Fix bug
    - [x]  Dịch file không view ở trong app luôn
    - [x]  Preview không view trong app luôn
    - [x]  Dịch camera ảnh lỗi
    - [x]  Bỏ popup GPT
    - [x]  header cần cho font weight đậm hơn
    - [x]  header cần cho text full
    - [x]  Quảng cáo native không hiện
    - [x]  modal new conversation
    - [x]  Quảng cáo reward ở màn dịch camera không hoạt động
- [x]  Tối ưu quảng cáo
    - [x]  Banner
    - [x]  Native
    - [x]  Open app

ver 66

- [x]  Localize cho nhiều tiếng hơn
    - [x]  Commit code trước khi dịch
    - [x]  Xóa file khi localize xong
- [x]  Sửa lại default system ở màn language
- [x]  Clear view ở màn language
- [x]  Thêm thông báo quay lại app khi user thoát
- [x]  Quảng cáo native onboard không hiện
- [x]  Dịch file cho button rõ ràng
- [x]  Quảng cáo inter cần preload khi vào tính năng luôn
- [x]  Nâng button ở onboard và language lên + design sao cho 2 button giống nhau

- [x]  Đổi lại title thông báo, bỏ icon app ở notification đi
- [x]  kiểm tra lại cơ chế sau 10s không ấn thì hiện button màn language
- [x]  Sửa lại hình bàn tay ở màn language

ver 72

- [x]  Fix crash thư viện ad
- [x]  Sửa màn onboard native ad
- [x]  Nâng 16kb size

ver 73

- [x]  fix crash PdfView.drawPdf
- [x]  fix crash SIGSEGV [libpdfium.so](http://libpdfium.so/)
- [x]  fix crash ResultView.lambda$show$0
- [x]  Thêm intro modal cho dịch document

ver 74

- [x]  Fix crash SIGABRT [libc.so](http://libc.so) (dịch word, excel tạo file không clean up sau khi dùng)
`;

async function main() {
    console.log('🚀 Starting re-import with timestamps...');

    // 1. Search for existing project
    const searchRes = await fetch(`${API_URL}/search?q=${encodeURIComponent(PROJECT_NAME)}&type=projects`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const searchData = await searchRes.json();
    const existing = searchData.data?.projects?.find(p => p.name === PROJECT_NAME);

    if (existing) {
        console.log(`⚠️ Found existing project ${existing.id}. Deleting...`);
        const delRes = await fetch(`${API_URL}/projects/${existing.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (!delRes.ok) {
            console.error('❌ Failed to delete existing project. Proceeding anyway, might duplicate.');
        } else {
            console.log('✅ Deleted existing project.');
        }
    }

    // 2. Create Project
    console.log(`Creating project: ${PROJECT_NAME}...`);
    const projectRes = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({ name: PROJECT_NAME })
    });

    const projectData = await projectRes.json();
    if (!projectData.success) {
        console.error('❌ Failed to create project:', projectData);
        return;
    }

    const projectId = projectData.data.id;
    console.log(`✅ Project created: ${projectId}`);
    await importVersions(projectId);
}

async function importVersions(projectId) {
    const versions = parseData(RAW_DATA);

    // Strategy: Start from ~3 months ago.
    // Increment by ~3 days per version.
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (versions.length * 3)); // 3 days per version roughly

    for (let i = 0; i < versions.length; i++) {
        const v = versions[i];

        // Calculate timestamp
        const date = new Date(startDate);
        date.setDate(date.getDate() + (i * 3));
        const createdAt = date.toISOString();

        console.log(`\n📦 Importing ${v.name}...`);

        const verRes = await fetch(`${API_URL}/projects/${projectId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({ name: v.name, migratePendingTasks: false, createdAt })
        });

        const verData = await verRes.json();
        if (!verData.success) {
            console.error(`❌ Failed to create version ${v.name}:`, verData);
            continue;
        }

        const versionId = verData.data.id;
        console.log(`   ✅ Version created: ${versionId} (${createdAt})`);

        if (v.tasks.length > 0) {
            console.log(`   📝 Importing ${v.tasks.length} tasks...`);

            const operations = v.tasks.map(param => ({
                action: 'create',
                projectId,
                versionId,
                content: param.content,
                isDone: param.isDone,
                createdAt: createdAt,
                doneAt: param.isDone ? createdAt : undefined
            }));

            const bulkRes = await fetch(`${API_URL}/tasks/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({ operations })
            });

            const bulkData = await bulkRes.json();
            if (bulkData.success) {
                console.log(`   ✅ Success: ${bulkData.data.created} created`);
            } else {
                console.error('   ❌ Bulk import failed:', bulkData);
            }
        }
    }

    console.log('\n🎉 Import complete!');
}

function parseData(text) {
    const lines = text.split('\n');
    const versions = [];
    let currentVersion = null;

    const versionRegex = /^ver\s*(\d+.*)/i;
    // Match check lists: - [x] or - [ ] 
    // Captures: 1=indent, 2=x or space, 3=content
    const taskRegex = /^(\s*)-\s*\[([ xX])\]\s*(.+)/;

    for (let line of lines) {
        line = line.trimEnd();
        if (!line.trim()) continue;

        const verMatch = line.trim().match(versionRegex);
        if (verMatch) {
            currentVersion = {
                name: `Version ${verMatch[1]}`,
                tasks: []
            };
            versions.push(currentVersion);
            continue;
        }

        const taskMatch = line.match(taskRegex);
        if (taskMatch) {
            if (!currentVersion) continue;

            const indent = taskMatch[1];
            const isChecked = taskMatch[2].toLowerCase() === 'x';
            let content = taskMatch[3];

            // Preserve some hierarchical structure visually if needed, though API flat.
            // If indented, maybe prefix with arrow or indent.
            if (indent.length >= 2) content = "    " + content;

            currentVersion.tasks.push({
                content,
                isDone: isChecked
            });
        }
    }
    return versions;
}

main().catch(console.error);
