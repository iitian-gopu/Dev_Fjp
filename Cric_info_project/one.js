//Require
let minimist = require('minimist');
let jsdom = require('jsdom')
let fs=require('fs')
let axios = require('axios')
let excel=require('excel4node')
let pdf=require('pdf-lib')
let path=require('path');
const { pbkdf2 } = require('crypto');
//input taken
let args=minimist(process.argv)
//download html
axios.get('https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results').then(function(response) {
let html =response.data
//dom
let dom = new jsdom.JSDOM(html);
let matches = []
  let matchscore=dom.window.document.querySelectorAll('div.match-score-block');
  for (let i=0; i<matchscore.length; i++){
      //pushing match
      let match ={

      }
      let namePs=matchscore[i].querySelectorAll("p.name")
      // preapring team1 and team2 name 
      match.t1=namePs[0].textContent;
      match.t2=namePs[1].textContent;
      // preapring team1 and team2 score 
      let scoredetail=matchscore[i].querySelectorAll("div.score-detail>span.score")
      match.t1s="match abonded";
      match.t2s="match abonded"
      
      if(scoredetail.length==2){
          match.t1s=scoredetail[0].textContent;
          match.t2s=scoredetail[1].textContent;
      }
      else if(scoredetail.length==1){
          match.t1s=scoredetail[0].textContent
          
      }
      else{

      }
     
    // preapring result
      match.result=matchscore[i].querySelector("div.status-text").textContent
      //push match in matches array
      matches.push(match)
     
      
  }
 
 let teams=[];
 for(let i=0;i<matches.length;i++){
    populateteam(teams,matches[i].t1)
    populateteam(teams,matches[i].t2)
 }
 for(let i=0;i<matches.length;i++){
    populatematches(teams,matches[i])
 }

createexcel(teams)
createfolder(teams)

})
function populateteam(teams,teamname){
    let t1index=-1;
    for(let i=0;i<teams.length; i++){
        if(teams[i].name==teamname){
            t1index=i;
            break;
        }
    }
    if(t1index==-1){
        teams.push({
            name:teamname,
            matches:[]
        })
    }
  
    
}
function populatematches(teams,match){
    let t1index=-1;
    for(let i=0;i<teams.length; i++){
        if(match.t1==teams[i].name){
            t1index=i;
            break;
        }
    }
    let team1=teams[t1index];
team1.matches.push({
    vs:match.t2,
    selfscore:match.t1s,
    oppscore:match.t2s,
    result:match.result
})
let t2index=-1;
    for(let i=0;i<teams.length; i++){
        if(match.t2==teams[i].name){
            t2index=i;
            break;
        }
    }
    let team2=teams[t2index];
    team2.matches.push({
        vs:match.t1,
        selfscore:match.t2s,
        oppscore:match.t1s,
        result:match.result
    })
}
function createexcel(teams){
    let wb=new excel.Workbook();
    for(let i=0;i<teams.length;i++){
        let sheet=wb.addWorksheet(teams[i].name);
        sheet.cell(1,1).string("VS")
        sheet.cell(1,2).string("SELF_SCORE")
        sheet.cell(1,3).string("OPP_SCORE")
        sheet.cell(1,4).string("RESULT")
        for (let j = 0; j < teams[i].matches.length; j++) {
            sheet.cell(2+j,1).string(teams[i].matches[j].vs)
            sheet.cell(2+j,2).string(teams[i].matches[j].selfscore)
            sheet.cell(2+j,3).string(teams[i].matches[j].oppscore)
            sheet.cell(2+j,4).string(teams[i].matches[j].result)
            
        }
    }
    
    wb.write("worldcup.csv")
}
function createfolder(teams) {
    if(fs.existsSync("data")==true){
      fs.rmdirSync("data",{recursive:true})
    }
    fs.mkdirSync("data")
for (let i = 0; i < teams.length; i++){
   let fldrnme= path.join("data",teams[i].name);
   
   fs.mkdirSync(fldrnme)
   
for(let j = 0; j < teams[i].matches.length; j++){
let match=teams[i].matches[j]
createscorecard(fldrnme,match,teams[i].name)
}
}
}
function createscorecard(fldrnme,match,hometeam){
    let matchfilename=path.join(fldrnme,match.vs)
    let tempkabytes=fs.readFileSync("Template.pdf")
   let pdfdockaprmis=pdf.PDFDocument.load(tempkabytes)
   pdfdockaprmis.then(function(pdfdoc){
       let page=pdfdoc.getPage(0)
       page.drawText(hometeam,{
        x: 300,
        y: 685,
        size: 19,
        
       }
       
       );
       page.drawText(match.vs,{
        x: 300,
        y: 650,
        size: 19,
      
       }
       
       );
       
       page.drawText(match.selfscore,{
        x: 300,
        y: 610,
        size: 19,
        
       }
       );
       
       page.drawText(match.oppscore,{
        x: 300,
        y: 573,
        size: 19,
        
       }
       
       );
       page.drawText(match.result,{
        x: 300,
        y: 550,
        size: 11,
       
       }
       
       );
       
       let changebyteskaprms=pdfdoc.save();
       changebyteskaprms.then(function(changedbytes){
           if(fs.existsSync(matchfilename+".pdf")==true){
       fs.writeFileSync(matchfilename+"1.pdf",changedbytes)
           }
           else{
            fs.writeFileSync(matchfilename+".pdf",changedbytes) 
           }
       })
   })
}
