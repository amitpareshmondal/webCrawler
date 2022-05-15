const express=require('express');
const body=require("body-parser");
const cheerio=require('cheerio');
const pup=require('puppeteer');
const app=express();
const axios=require("axios");
const urlParser=require("url");
var Url = require('url-parse');
app.use(body.json());
app.use(body.urlencoded({extended:true}));
app.set('view engine','ejs');
var validator = require('validator');
// const { response } = require('express');
// const { link } = require('fs');
app.use(express.static(__dirname+"/public"));
//get request on home page
app.get("/",(req,res)=>{
    res.render("index");
})
var url="";
const t=Date.now();
app.post("/",(req,res)=>{
    (
        async()=>{
        
          url=req.body.url;
         if(validator.isURL(url,{protocols: ['http','https','ftp'], require_tld: true, require_protocol: true})){
            // var pageUrl=url;
            // const response = await page.goto(pageUrl, {waitUntil: 'networkidle0'});
            // const securityDetails = await response.securityDetails();
            // console.log(securityDetails.issuer());
            // console.log(securityDetails.subjectName());
            // console.log(securityDetails.validFrom());
            // console.log(securityDetails.validTo());
            // var date=new Date(securityDetails.validTo()*1000);
            // console.log(date.getDate());
            // console.log(date.getMonth());
            // console.log(date.getFullYear());
            // console.log(securityDetails.protocol());
            // browser.close();
            res.render("second",{link:url});
         }
         else{
     res.render("loading");
         }
      
        }
     )();
})
app.post('/ssl',(req,res)=>{
    var checkssl=true;
    (
        async()=>{
            
            const browser=await pup.launch({headless:false});
            const page=await browser.newPage();
            var pageUrl=url;
            const response = await page.goto(pageUrl, {waitUntil: 'networkidle0'});
            const securityDetails = await response.securityDetails();
            const issuer=securityDetails.issuer();
            const domain=securityDetails.subjectName();
            var date=new Date(securityDetails.validTo()*1000);
            const day=date.getDate();
            const month=date.getMonth()+1;
            const year=date.getFullYear();
            const pro=securityDetails.protocol();
            browser.close();
            let parse = require('url-parse');
            urli = parse(url, true);
            console.log(urli.hostname);
            var report={
                correct:"",
                expiry:"",
            }
            if(urli.hostname===domain){
                  report.correct="Certificate Assigned To This Domain Name Only";
            }
            else{
                report.correct="InValid The Certificate is issigned to other Domain ";
            }
            var NowDate=new Date();
            if(year>NowDate.getFullYear()){
                report.expiry="Not Expired";
            }
            else if(year===NowDate.getFullYear()){
                if(month>NowDate.getMonth()){
                    report.expiry="Not Expired";
                }
                else if(month===NowDate.getMonth()){
                    if(day>NowDate.getDate()){
                        report.expiry="Not Expired But it will Expire Soon";
                    }
                    else{
                        report.expiry="Expired";
                    }
                }
                else{
                    report.expiry="Expired";
                }
            }
            else if(year<NowDate.getFullYear()){
                report.expiry="Expired";
            }
            res.render("ssl",{Issuer:issuer,Domain:domain,Day:day,Month:month,Year:year,Pro:pro,Correct:report.correct,Expiry:report.expiry})
        }
    )();
  
});
app.post("/cookie",(req,res)=>{
    var cookieConsent=false;
    (
        async()=>{
            const res=await axios.get(url);
            const html=await res.data;
            const $=cheerio.load(html);
            console.log(html);
            $('a').each(function(){
                var temp=$(this).text();
                if(temp.includes("cookie")||temp.includes("cookie consent")||temp.includes("accept")||temp.includes("cookie Consent Link")||temp.includes("privacy")){
                    cookieConsent=true;
                }
                console.log(temp);
            })
        }
    )();
    (
        async()=>{
            console.log("I am here");
            const browser=await pup.launch();
            const page=await browser.newPage();
            var pageUrl=url;
            const response = await page.goto(pageUrl, {waitUntil: 'networkidle0'});
            var data = await page._client.send('Network.getAllCookies');
            var count=0
            var total=0;
           
            data.cookies.forEach(function(coo){
                total++;
                if(coo.value==1){
                    count++;
                }
            })
            if (data===null){
                res.render("cookie",{CookieData:data.cookies})
               console.log("not got");
               browser.close();
            }
            else{
               res.render("cookie",{CookieData:data.cookies,Session:count,Total:total,consent:cookieConsent})
               console.log(data);
               browser.close();
            }
    browser.close();
        }
    )();
});
app.post("/ada",(req,res)=>{
    const MainUrl=url;
    var altcount=0;
    var imgcount=0;
    var tabcount=0;
    function crawl(link){
        axios(link)
        .then(response=>{
            const html=response.data;
            const $=cheerio.load(html);
            $('img').each((index,alt)=>{
                var imgsrc=$(alt).attr('alt');
                if(imgsrc===" "||imgsrc==="#"||imgsrc===""){
                    var imgnotsrc=$(alt).attr('src');
                    console.log("Alt text not present at "+imgnotsrc+ " at"+link);
                    console.log("Not Image");
                    altcount++;
                }
                else{
                    imgcount++;
                    console.log(imgsrc);
                }
            })
            tabIndex(link);
        })

    }
    // crawl({link:url})
    function tabIndex(link){
        axios(link)
        .then(response=>{
            const html=response.data;
            const $=cheerio.load(html);
            $('p').each((index,alt)=>{
                let tab=$(alt).attr('tabindex');
                if(tab!=null||tab>=0){
                    console.log("not correct tabindex");
                    tabcount++;
                }
                else{
                    console.log("no problem");
                }
            })
            colorContrast(link);
        })
    }
//    tabIndex(url);
async function colorContrast (link){
    const browser=await pup.launch({headless:false});
            const page=await browser.newPage();
            var pageUrl=link;
    await page.goto("https://color.a11y.com/Contrast/");
await page.type("#urltotest",pageUrl);
await page.click('#submitbutton');
await page.waitForNavigation({ waitUntil: 'networkidle0' });
await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
await page.waitForSelector('#resultsbox');
const data2 = await page.evaluate(() =>document.getElementById('resultsbox').innerHTML);
browser.close();
res.render("ada",{table:data2,Tab:tabcount,Img:imgcount,alt:altcount});
const $=cheerio.load(data2);
}


crawl(url);
});
//App.listen()
app.listen(process.env.PORT || 3000,()=>{
    console.log("Server running on port 3000");
})