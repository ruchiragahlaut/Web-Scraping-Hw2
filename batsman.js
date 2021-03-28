//npm install request
//npm install cheerio
let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let path = require("path");

let folder = "teams";

console.log("before");
request("https://www.espncricinfo.com/series/ipl-2020-21-1210595",cb);
function cb(error, response, html) {
    if (error) {
        console.log("heelo")
        console.log(error)
    } else {
        // console.log(html);
        extractHtml(html);
    }
}

function extractHtml(html){
    let seltool = cheerio.load(html);
    let topicsArr = seltool(".jsx-850418440.nav-item a");
    console.log(topicsArr.length);
    let link = seltool(topicsArr[2]).attr("href");
    let fulllink = "https://www.espncricinfo.com" + link;
    //console.log(fulllink);
    processrepoPage1(fulllink);
   
}
function processrepoPage1(fulllink){
    request(fulllink,cb);
    function cb(error,resp,html){
    if (error) {
        console.log(error)
    } else {
        //console.log(html);
        getTeamNames(html);
    }
}
}

function getTeamNames(html){
    let seltool = cheerio.load(html);
    let teamCard = seltool(".header-title.label");
    let teamArr = [];
    for(let i=1;i<teamCard.length;i++){
        let name = seltool(teamCard[i]).text().trim();
        dirCreater(folder,name);
        teamArr.push(name);
        processrepoPage2("https://www.espncricinfo.com/series/ipl-2020-21-1210595/match-results");

    }

}

function  dirCreater(mainFolder,name){
    let pathofFolder = path.join(mainFolder,name);
    if(fs.existsSync(pathofFolder)==false){
        fs.mkdirSync(pathofFolder);
    }
}

function processrepoPage2(fulllink){
    request(fulllink,cb);
    function cb(error,resp,html){
    if (error) {
        console.log(error)
    } else {
        //console.log(html);
        getScoreCard(html);
    }
}
}


function getScoreCard(html){
    let selTool=cheerio.load(html);
    let scoreArr=selTool(".match-cta-container a");
    let scoreCardLinkArr=[];
    for(let i=2;i<scoreArr.length;i+=4){
        let scoreArrLink=selTool(scoreArr[i]).attr("href");
        scoreCardLinkArr.push("https://www.espncricinfo.com"+scoreArrLink);
        

    }
    visitScoreCardLinks(scoreCardLinkArr,0);
}



function visitScoreCardLinks(scoreCardLinkArr,count){
    if (count == scoreCardLinkArr.length) {
        return;
    }
    request(scoreCardLinkArr[count],cb3);

    function cb3(err, resp, html) {
        if (err) {
            console.log(err);
        } else {
            extractTeamNames(html);
            visitScoreCardLinks(scoreCardLinkArr, count + 1);
        }
    }
}

function extractTeamNames(html){
    let selTool=cheerio.load(html);
    let teamNames=selTool(".match-info.match-info-MATCH .name");
    //console.log(teamNames.text());

    let batsmanTable=selTool(".Collapsible__contentInner .table.batsman");
    for(let j=0;j<batsmanTable.length;j++){
    
        let names=selTool(teamNames[j]).text();
        let batsmanNameArr=selTool(batsmanTable[j]).find("tbody tr a");
        for(let k=0;k<batsmanNameArr.length;k++){
            let batsmanName=selTool(batsmanNameArr[k]).text();
            if(names=="Kings XI Punjab"){
                let temp = names;
                names = "Punjab Kings"

            }
           storeDetailsInObject(names,batsmanName,html,teamNames);
           
        }
        
    }

}


function storeDetailsInObject(teamName,batsmanName,html,teamNamesArr){
    let pathOfFile=path.join(__dirname,"teams",teamName,batsmanName+".json");
    let selTool=cheerio.load(html);
    let venueDate=selTool(".match-info.match-info-MATCH .description").text();
    let venueDateArr=venueDate.split(",");
    let venue=venueDateArr[1];
    let date=venueDateArr[2];

    
    let opponent_name=selTool(teamNamesArr[0]).text();
    if(opponent_name==teamName){
        opponent_name=selTool(teamNamesArr[1]).text();
    }


    let result=selTool(".match-info.match-info-MATCH .status-text span").text();
    let batsmanTable=selTool(".Collapsible__contentInner .table.batsman");
    for(let j=0;j<batsmanTable.length;j++){
        let batsmanNameArr=selTool(batsmanTable[j]).find("tbody tr");
        for(let k=0;k<batsmanNameArr.length;k++){
            let batsmanNameCheck=selTool(batsmanNameArr[k]).find("a").text();
            if(batsmanNameCheck==batsmanName){

                let column=selTool(batsmanNameArr[k]).find("td");

                let batsmanStats={

                    "runs":selTool(column[2]).text(),
                    "balls":selTool(column[3]).text(),
                    "fours":selTool(column[5]).text(),
                    "sixes":selTool(column[6]).text(),
                    "sr":selTool(column[7]).text(),
                    "date":date,
                    "venue":venue,
                    "result":result,
                    "opponentName":opponent_name

                };

                //Create JSON File 
                console.log("--------------");
                createJSONFile(pathOfFile,batsmanStats);  
        
                
            }

            
            
}
    }
}



function createJSONFile(pt,obj){
    let arr;
    if(fs.existsSync(pt)==false)
       { 
           fs.openSync(pt,"w");
            arr=[];
            arr.push(obj);
       }
       else{
           content=fs.readFileSync(pt);
           arr=JSON.parse(content);
           arr.push(obj);
       }
    let contentinFile=JSON.stringify(arr);
    fs.writeFileSync(pt,contentinFile);
}

