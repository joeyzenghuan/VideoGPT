// 测试截图功能
const path = require('path');
const fs = require('fs');

// 检查截图目录
const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
console.log("截图目录:", screenshotsDir);
console.log("截图目录是否存在:", fs.existsSync(screenshotsDir));

if (fs.existsSync(screenshotsDir)) {
  const files = fs.readdirSync(screenshotsDir);
  console.log("现有截图文件数量:", files.length);
  console.log("现有截图文件:");
  files.forEach(file => {
    console.log(" -", file);
  });
  
  // 检查文件命名格式
  const validFormat = files.filter(file => {
    return file.match(/^screenshot_[^_]+_\d+s_[^.]+\.jpg$/);
  });
  console.log("符合命名格式的文件:", validFormat.length);
}

console.log("\n检查完成！");
