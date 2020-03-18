const percentages = ["twenty", "forty", "sixty"];
const months = ["six", "twelve", "eighteen"];
const states = document.getElementById("states");
let selectedState = states.value;

function init(){
  for (var i = 0; i < percentages.length; i++) {
    for(var j = 0; j < percentages.length; j++){
      drawMap(selectedState, percentages[i], months[j]);
    }
  }
}

init();

states.addEventListener("change", function(){
    selectedState = states.value;
    init();
})

const colorScale = d3.scaleSequential(d3.interpolateViridis);

function drawMap(state, percent, month){

  d3.selectAll("svg").remove();

  d3.queue()
  .defer(d3.json, "../src/data/hhr.geojson")
  .defer(d3.csv, "../src/data/hospital_20.csv")
  .defer(d3.csv, "../src/data/hospital_40.csv")
  .defer(d3.csv, "../src/data/hospital_20.csv")
  .await(function(error, map, hospitaltwenty, hospitalforty, hospitalsixty){

    if(error) throw error;

    const chartDiv = d3.select(`#${percent}-percent-${month}-months`);
    const { width, height } = chartDiv.node().getBoundingClientRect();
    const svg = chartDiv.append("svg")
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style("position", "absolute");

    map.features = map.features.filter(function(d){
        return d.properties.hrr_name.includes(`${state} - `) 
    })

    let hospital;

    if (percent == "twenty"){
      hospital = hospitaltwenty;
    }else if (percent == "forty"){
      hospital = hospitalforty;
    }else if (percent == "sixty"){
      hospital = hospitalsixty;
    }

    var joinedMap = totalBedNeededPercentage(map, hospital); 

    // console.log(joinedMap)

    colorScale.domain([0, 1, 2]);

    const projection = d3.geoMercator()
      .fitSize([width, height], joinedMap);

    const path = d3.geoPath()
      .projection(projection);

    const states = svg.selectAll("path")
      .data(joinedMap.features);

    states.enter().append("path")
      .attr("d", path)
      .attr("fill", d => colorScale(d.properties[`${month}Month`]))
      .attr("stroke", "gray");

  })

}

function totalBedNeededPercentage(mapData, hospitalData){

    mapData.features.forEach(function(d){
      d.properties.hrr_region = d.properties.hrr_name.split(" - ")[1];
    })
    
    hospitalData.forEach(function(d){
      d.hrr_region = d.HRR.split(",")[0];
    })

    for (var i = 0; i < mapData.features.length; i++){
      for(var j = 0 ; j < hospitalData.length; j++){
        var mapRegion = mapData.features[i].properties.hrr_region;
        var hospitalRegion = hospitalData[j].hrr_region;
        var totalBedNeededPercentageSix = parseFloat(hospitalData[j]["Percentage of Total Beds Needed, Six Months"])/100,
        totalBedNeededPercentageTwelve = parseFloat(hospitalData[j]["Percentage of Total Beds Needed, Twelve Months"])/100,
        totalBedNeededPercentageEighteen = parseFloat(hospitalData[j]["Percentage of Total Beds Needed, Eighteen Months"])/100  

        if (mapRegion == hospitalRegion) {
            mapData.features[i].properties.sixMonth = totalBedNeededPercentageSix;
            mapData.features[i].properties.twelveMonth = totalBedNeededPercentageTwelve;
            mapData.features[i].properties.eighteenMonth = totalBedNeededPercentageEighteen;
            break;
        }
      }
    }

    return mapData;
}
