// node .\automation.js --url=https://www.hackerrank.com --config=config.json
let minimist = require('minimist')
let puppeteer = require('puppeteer');
let fs= require('fs')
let args = minimist(process.argv)
let configfile=fs.readFileSync(args.config,"utf8")
let config=JSON.parse(configfile);


(async () => {
  let browser =  await puppeteer.launch({
    headless: false,
    defaultViewport: null,
      args: ['--start-maximized'] 
  });
  let page = await browser.newPage();
  await page.goto(args.url);
 await page.waitForSelector("a[data-event-action='Login']")
 await page.click("a[data-event-action='Login']")
 await page.waitForSelector("a[href='https://www.hackerrank.com/login']")
 await page.click("a[href='https://www.hackerrank.com/login']")
 await page.waitForSelector("input[name='username']")
 await page.type("input[name='username']",config.userid,{delay:50})
 await page.waitForSelector("input[name='password']")
 await page.type("input[name='password']",config.password,{delay:50})

 await page.waitForSelector("button[data-analytics='LoginPassword']");
 await page.click("button[data-analytics='LoginPassword']");

 await page.waitForSelector("a[href='/contests']")
await page.click("a[href='/contests']")

await page.waitForSelector("a[href='/administration/contests/']")
await page.click("a[href='/administration/contests/']")


await page.waitFor(3000)
// find all pages 
await page.waitForSelector("a[data-attr1='Last']");
let numpages=await page.$eval("a[data-attr1='Last']",function(atag){
  let toatalpages=parseInt(atag.getAttribute("data-page"))
  return toatalpages;
});
for(let i=1;i<=numpages;i++){
  await handleallcontest(page,browser);
  
  if (i != numpages) {
    await page.waitForSelector("a[data-attr1='Right']");
    await page.click("a[data-attr1='Right']");
}
}
// find all urls of same page

async function handleallcontest(page,browser){
  await page.waitForSelector("a.backbone.block-center");
let curls = await page.$$eval("a.backbone.block-center", function (atags) {
    let urls = [];

    for (let i = 0; i < atags.length; i++) {
        let url = atags[i].getAttribute("href");
        urls.push(url);
    }

    return urls;
})

for(let i = 0; i <curls.length;i++){
  let curl= curls[i];
  let ctab= await browser.newPage();
  await savemoderatorincontest(ctab,args.url+curl,config.moderators);
  await ctab.close();
  await page.waitFor(3000)


}
}
async function savemoderatorincontest(ctab,fullcurl,moderator){
  await ctab.bringToFront()
  await ctab.goto(fullcurl);
  await ctab.waitFor(3000)
  //click on moderator tab
  await ctab.waitForSelector("li[data-tab='moderators']");
    await ctab.click("li[data-tab='moderators']");

    // type in moderator
    await ctab.waitForSelector("input#moderator");
    await ctab.type("input#moderator", moderator, { delay: 50 });

    // press enter
    await ctab.keyboard.press("Enter");
}

})();
