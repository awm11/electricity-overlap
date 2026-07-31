import { useEffect, useRef, useState } from "react";
import defaultCircuit from "./circuits/default-circuit.json";
import simpleCircuit from "./circuits/simple-circuit.json";
import seriesCircuit from "./circuits/series-circuit.json";
import parallelCircuit from "./circuits/parallel-circuit.json";
import capacitorCircuit from "./circuits/capacitor-circuit.json";
import rectangularPlate from "./circuits/rectangular-plate.json";
import combinationCircuit from "./circuits/combination-circuit.json";


const ElectronDensity = 0.0045;
const GRID_SIZE = 4;
const ELECTRON_RADIUS = 3;
const WALL_BUFFER = ELECTRON_RADIUS + 5;
const BatteryStrength = 0.040;
const SIM_SPEED = 2

class Electron {constructor(x, y) {

    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5);
    this.vy = (Math.random() - 0.5);
    this.radius = ELECTRON_RADIUS;
    this.carried = false;
    this.carrier = null;
    this.offsetX = 0;
    this.offsetY = 0;
  }

}

class Ammeter{constructor(x1,y1,x2,y2){
    this.x1=x1;
    this.y1=y1;
    this.x2=x2;
    this.y2=y2;
    this.id = Math.random().toString(36).slice(2,7);
    this.readings=[];
    this.current = 0;
    this.average = 0;
    this.displayAverage = 0;
    this.lastDisplayUpdate = 0;
  }

  contains(x,y){
    const cx = (this.x1+this.x2)/2;
    const cy = (this.y1+this.y2)/2;
    const rx = Math.hypot(this.x2-this.x1,this.y2-this.y1)/2;
    const ry = 10;
    const angle = Math.atan2(this.y2-this.y1,this.x2-this.x1);

    const dx = x-cx;
    const dy = y-cy;

    const xr = dx*Math.cos(-angle)-dy*Math.sin(-angle);
    const yr = dx*Math.sin(-angle)+dy*Math.cos(-angle);

    return (xr*xr)/(rx*rx)+(yr*yr)/(ry*ry) <= 1;
  }

}

class Component {

    constructor(type, x, y, orientation = "horizontal") {
    this.id = crypto.randomUUID();
    this.type = type;
    this.x = x;
    this.y = y;
    this.placedX = x;
    this.placedY = y;
    this.orientation = orientation;
    this.voltage = 0;

    if(type === "wire"){
        if(orientation === "vertical"){
        this.width = 60;
        this.height = 150;
        }
        else{
        this.width = 250;
        this.height = 60;
        }
    }

    if(type === "squarewire"){
        this.width = 60;
        this.height = 60;
    }

    if(type === "resistor"){
        if(orientation === "vertical"){
        this.width = 20;
        this.height = 200;
        }
        else{
        this.width = 200;
        this.height = 20;
        }
    }

    if(type === "battery"){
        this.voltage = 1;
        this.direction = orientation === "vertical"
            ? {x:0, y:-1}
            : {x:1, y:0};
        if(orientation === "vertical"){
        this.width = 120;
        this.height = 180;
        }
        else{
        this.width = 180;
        this.height = 120;
        }
    }

    if(type === "bonus-electrons"){
        this.width = 60;
        this.height = 60;
    }

    }

  contains(x,y){
    return (

      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );

  }



  spawnElectrons(electrons) {
    const amount = Math.floor(
        this.width *
        this.height *
        ElectronDensity
    );

    const spawnWidth = Math.max(
        0,
        this.width - WALL_BUFFER * 2
    );

    const spawnHeight = Math.max(
        0,
        this.height - WALL_BUFFER * 2
    );

    for (let i = 0; i < amount; i++) {
        electrons.push(
        new Electron(
            this.x +
            WALL_BUFFER +
            Math.random() * spawnWidth,

            this.y +
            WALL_BUFFER +
            Math.random() * spawnHeight
        )
        );
    }
  }

  drawBattery(ctx){

      const positive = this.voltage >= 0;

      ctx.fillStyle = "#212121";
      ctx.fillRect(
        this.x,
        this.y,
        this.width,
        this.height
      );

      ctx.fillStyle = "#f5a623";

      if(this.orientation === "vertical"){

        if(positive){
          ctx.fillRect(
            this.x,
            this.y + this.height*0.70,
            this.width,
            this.height*0.3
          );
        }
        else{
          ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height*0.3
          );
        }

      }
      else{

        if(positive){
          ctx.fillRect(
            this.x,
            this.y,
            this.width*0.3,
            this.height
          );
        }
        else{
          ctx.fillRect(
            this.x + this.width*0.7,
            this.y,
            this.width*0.3,
            this.height
          );
        }

      }

      ctx.strokeStyle = "#6e6c6c";
      ctx.lineWidth = 4;

      ctx.strokeRect(
        this.x,
        this.y,
        this.width,
        this.height
      );
      

      ctx.save();

      ctx.fillStyle = "#000";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if(this.orientation === "vertical"){

        ctx.fillText(
          positive ? "−" : "+",
          this.x + this.width/2,
          this.y + this.height*0.15
        );

        ctx.fillText(
          positive ? "+" : "−",
          this.x + this.width/2,
          this.y + this.height*0.85
        );

      }
      else{

        ctx.fillText(
          positive ? "+" : "−",
          this.x + this.width*0.15,
          this.y + this.height/2
        );

        ctx.fillText(
          positive ? "−" : "+",
          this.x + this.width*0.85,
          this.y + this.height/2
        );

      }

      ctx.restore();

      }


  draw(ctx, pdSelection, selectedObject, showLabel=true){

    ctx.lineWidth = 4;

    if(pdSelection.includes(this)){
        ctx.strokeStyle = "limegreen";
    }
    else if(this.type==="battery"){
        this.drawBattery(ctx);
        return;
    }
    else if(this.type==="resistor"){
        ctx.strokeStyle="#d9b1b1";
    }
    else{
        ctx.strokeStyle="#e0e0e0";
    }

    ctx.strokeRect(
        this.x,
        this.y,
        this.width,
        this.height
    );

    if(selectedObject.current?.type==="component" &&
         selectedObject.current.object===this
        ){
          ctx.fillStyle = "rgba(0,200,255,0.2)";
          ctx.fillRect(
            this.x,
            this.y,
            this.width,
            this.height
        );
      }
      
    if(showLabel){
      ctx.fillStyle = "black";
      ctx.font = "10px Arial";
      ctx.fillText(
          this.type,
          this.x + 5,
          this.y - 5
      );
     }
    }

    

}

function createEmptyCell(){
  return {
    occupied:false,
    material:null
  };
}

function buildCircuitMap(
  components,
  width,
  height
){
  const cols =
    Math.ceil(
      width / GRID_SIZE
    );
  const rows =
    Math.ceil(
      height / GRID_SIZE
    );
  const map =
    Array.from(
      {
        length:rows
      },
      ()=>
        Array.from(
          {
            length:cols
          },
          createEmptyCell
        )
    );

  for(const component of components){
    const x1 =
      Math.floor(
        component.placedX /
        GRID_SIZE
      );

    const x2 =
      Math.floor(
        (component.placedX +
        component.width)
        /
        GRID_SIZE
      );

    const y1 =
      Math.floor(
        component.placedY /
        GRID_SIZE
      );

    const y2 =
      Math.floor(
        (component.placedY +
        component.height)
        /
        GRID_SIZE
      );


    for(
      let y=y1;
      y<=y2;
      y++
    ){

      for(
        let x=x1;
        x<=x2;
        x++
      ){

        const cell =
          map[y]?.[x];
        if(cell){
          cell.occupied = true;
          cell.material =
            component.type;

        }
      }
    }
  }

  return map;

}

function insideCircuit(

  x,

  y,

  map

){


  const gx =

    Math.floor(

      x / GRID_SIZE

    );



  const gy =

    Math.floor(

      y / GRID_SIZE

    );



  return (

    map[gy]?.[gx]?.occupied

    ??

    false

  );

}


function isWallCell(
  x,
  y,
  map
){

  const cell =
    map[y]?.[x];


  if(!cell?.occupied)
    return false;

  const neighbours = [
    map[y-1]?.[x],
    map[y+1]?.[x],
    map[y]?.[x-1],
    map[y]?.[x+1]
  ];

  return neighbours.some(
    n => !n?.occupied
  );
}

function wallColour(material){
  if(material==="wire")
    return "#a3a3a3";
  if(material==="squarewire")
    return "#a3a3a3";
  if(material==="resistor")
    return "#c94d4d";
  if(material==="battery")
    return "#f5d58a";
  return "#cccccc";
}

function drawWalls(
  ctx,
  map,
){

  for(
    let y=0;
    y<map.length;
    y++
  ){

    for(
      let x=0;
      x<map[y].length;
      x++
    ){


      const cell =
        map[y][x];



      if(
        cell.occupied &&
        isWallCell(
          x,
          y,
          map
        )
      ){

        ctx.fillStyle =
          wallColour(
            cell.material
          );



        ctx.fillRect(

          x * GRID_SIZE,

          y * GRID_SIZE,

          GRID_SIZE,

          GRID_SIZE

        );

      }

    }

  }

}

function moveElectron(
  electron,
  map,
  dt
){
  if(electron.carried)
    return;

  const nextX =
    electron.x +
    electron.vx * dt;

  const nextY =
    electron.y +
    electron.vy * dt;

  const canMoveX =
  insideCircuit(
    electron.x +
    electron.vx*dt +
    Math.sign(electron.vx) *
    WALL_BUFFER,
    electron.y,
    map
  );

    const canMoveY =
    insideCircuit(
        electron.x,
        electron.y +
        electron.vy*dt +
        Math.sign(electron.vy) *
        WALL_BUFFER,
        map
    );


  if(canMoveX){
    electron.x =
      nextX;
  }
  else{
    electron.vx *= -1;
  }

  if(canMoveY){
    electron.y =
      nextY;
  }
  else{
    electron.vy *= -1;
  }

}

function repelElectrons(electrons, dt){

  const mediumRange = 40;
  const repulsionStrength = 0.030;
  const VelocityDamping = Math.pow(0.997, dt);

  for(let i=0;i<electrons.length;i++){

    const a = electrons[i];

    if(a.carried)
      continue;

    for(let j=i+1;j<electrons.length;j++){

      const b = electrons[j];

      if(b.carried)
        continue;

      const dx = b.x-a.x;
      const dy = b.y-a.y;

      const distance = Math.sqrt(dx*dx+dy*dy);

      if(distance === 0)
        continue;

      const nx = dx/distance;
      const ny = dy/distance;

      // Medium-range repulsion
      if(distance < mediumRange){

        const force =
          repulsionStrength *
          (mediumRange-distance) /
          mediumRange;

        a.vx -= nx*force*dt;
        a.vy -= ny*force*dt;

        b.vx += nx*force*dt;
        b.vy += ny*force*dt;
      }


      // Hard collision separation
      const minimum = a.radius+b.radius;

    if(distance < minimum){

    const force =
        (minimum-distance)*0.05;

    a.vx -= nx*force*dt;
    a.vy -= ny*force*dt;

    b.vx += nx*force*dt;
    b.vy += ny*force*dt;
    }

    }
  }

  // Velocity damping
  for(const electron of electrons){

    if(electron.carried)
      continue;

    electron.vx *= VelocityDamping;
    electron.vy *= VelocityDamping;
  }
}

function applyBatteryForce(electrons, components, dt){
  for(const component of components){

    if(component.type !== "battery")
      continue;

    for(const electron of electrons){

      if(electron.carried)
        continue;

      if(component.contains(electron.x,electron.y)){
        electron.vx +=
          component.direction.x *
          component.voltage *
          BatteryStrength *
          dt;

        electron.vy +=
          component.direction.y *
          component.voltage *
          BatteryStrength *
          dt;

      }

    }

  }

}

function grabComponent(
  component,
  electrons
){

  for(const electron of electrons){


    if(

      component.contains(

        electron.x,

        electron.y

      )

    ){
      electron.carried =
        true;
      electron.carrier =
        component;
      electron.offsetX =
        electron.x -
        component.x;
      electron.offsetY =
        electron.y -
        component.y;

    }

  }

}


function carryElectrons(
  electrons
){
  for(const electron of electrons){
    if(
      electron.carried &&
      electron.carrier
    ){
      electron.x =
        electron.carrier.x +
        electron.offsetX;
      electron.y =
        electron.carrier.y +
        electron.offsetY;
    }
  }
}


function releaseElectrons(
  electrons
){
  for(const electron of electrons){
    electron.carried = false;
    electron.carrier = null;
  }
}

export default function App(){

  const electrons = useRef([]);
  const dragging = useRef(null);
  const dragOffset = useRef({x:0, y:0});
  const [tool, setTool] = useState(null);
  const toolRef = useRef(null);
  const canvasRef = useRef(null);
  const selectedObject = useRef(null);
  const [, forceUpdate] = useState(0);
  const canvasRect =  canvasRef.current?.getBoundingClientRect();
  const scaleX = canvasRect ? canvasRect.width / canvasRef.current.width : 1;
  const scaleY = canvasRect ? canvasRect.height / canvasRef.current.height : 1;
  const pdSelection = useRef([]);
  const ammeters = useRef([]);
  const ammeterStart = useRef(null);
  const mousePos = useRef({x:0,y:0});
  const pdReading = useRef({densityA: 0, densityB: 0, difference: 0, lastDisplayUpdate:0});

    function showTips(){

      const overlay = document.createElement("div");

      Object.assign(overlay.style,{
          position:"fixed",
          inset:"0",
          background:"rgba(0,0,0,0.45)",
          display:"flex",
          justifyContent:"center",
          alignItems:"center",
          zIndex:1000
      });


      const panel = document.createElement("div");

      Object.assign(panel.style,{
          background:"white",
          width:"500px",
          maxHeight:"70vh",
          overflowY:"auto",
          padding:"25px",
          borderRadius:"14px",
          boxShadow:"0 10px 40px rgba(0,0,0,0.3)",
          fontSize:"15px",
          lineHeight:"1.5",
          color:"#333"
      });

      const title = document.createElement("h2");
      title.textContent = "Tips & Help";

      Object.assign(title.style,{
          marginTop:"0",
          marginBottom:"15px",
          color:"#000"
      });

              // w - add new wire
              // r - add new resistory
              // b - add new battery
              // shift + w/r/b - add new horizontal wire/resistor/battery

      const content = document.createElement("div");

      content.innerHTML = `
          <p>
              Welcome to the circuit simulator!
          </p>

          <h3>Controls</h3>

          <p>
              Click and drag components to move them around. Connect components
              by overlapping them.
          </p>


          <h3>Hotkeys</h3>

          <ul>
              <li><b>Delete / Backspace</b> — delete selected object</li>
              <li><b>I</b> — toggle current measurement</li>
              <li><b>V</b> — toggle potential difference measurement</li>
              <li><b>Esc</b> — deselect object / exit measurement mode</li>
          </ul>


          <h3>Tips & Notes</h3>

          <p>
              Remember that this is only a simulation (!) and some real circuit
              behaviour is simplified or not represented accurately.
          </p>

          <ul>
              <li>Electrons only repel each other within a limited range.</li>
              <li>Electrons lose around 11% of their velocity every second.</li>
              <li>
                  Potential difference is calculated by comparing electron density
                  in the two selected components.
              </li>
              <li>
                  Battery voltage depends on current (as in the real world!), but
                  also depends on the number of available electrons.
              </li>
              <li>
                  Resistance does not always behave linearly. 🤷‍♂️
              </li>
              <li>
                  Don't forget that wires have significant resistance when compared
                  with the resistor.
              </li>
              <li>
                  Connections work best when given a large contact area, rather than channelling electrons through a narrow gap.
              </li>
          </ul>
      `;


      const closeButton = document.createElement("button");

      closeButton.textContent = "Close";

      Object.assign(closeButton.style,{
          marginTop:"20px",
          padding:"8px 18px",
          border:"none",
          borderRadius:"8px",
          cursor:"pointer",
          background:"#ddd",
          fontSize:"14px"
      });


      closeButton.onclick = ()=>{
          document.body.removeChild(overlay);
      };


      panel.appendChild(title);
      panel.appendChild(content);
      panel.appendChild(closeButton);


      overlay.onclick = e=>{
          if(e.target===overlay)
              document.body.removeChild(overlay);
      };


      overlay.appendChild(panel);
      document.body.appendChild(overlay);
  }

  function exportComponents(components) {

      const simplified = components.current.map(c => ({
          type: c.type,
          x: c.placedX,
          y: c.placedY,
          orientation: c.orientation
      }));

      const json = JSON.stringify(simplified, null, 2);

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "circuit.json";
      a.click();

      URL.revokeObjectURL(url);
  }


  function importCircuit() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = e => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();

          reader.onload = event => {
              const circuitData = JSON.parse(event.target.result);
              loadJSON(circuitData);
          };

          reader.readAsText(file);
      };

      input.click();
  }

  function loadFromPreset(){

      const presets = [
          {name:"Simple", json:simpleCircuit},
          {name:"Series", json:seriesCircuit},
          {name:"Parallel", json:parallelCircuit},
          {name:"Capacitor", json:capacitorCircuit},
          {name: "Rectangular plate", json:rectangularPlate},
          {name: "Combination circuit", json:combinationCircuit}
      ];

      const overlay = document.createElement("div");

      Object.assign(overlay.style,{
          position:"fixed",
          inset:"0",
          background:"rgba(0,0,0,0.45)",
          display:"flex",
          justifyContent:"center",
          alignItems:"center",
          zIndex:1000
      });


      const panel = document.createElement("div");

      const columns = Math.ceil(presets.length / 2);

      Object.assign(panel.style,{
          background:"white",
          padding:"25px",
          borderRadius:"14px",
          display:"grid",
          gridTemplateColumns:`repeat(${columns}, 200px)`,
          gap:"18px",
          boxShadow:"0 10px 40px rgba(0,0,0,0.25)"
      });


      for(const preset of presets){

          const card = document.createElement("div");

          Object.assign(card.style,{
              cursor:"pointer",
              textAlign:"center",
              width:"200px",
              height:"155px",
              padding:"8px",
              boxSizing:"border-box",
              borderRadius:"10px",
              transition:"transform 0.15s ease, box-shadow 0.15s ease",
              background:"#fafafa",
              display:"flex",
              flexDirection:"column",
              alignItems:"center"
          });


          card.onmouseenter = ()=>{
              card.style.transform="scale(1.03)";
              card.style.boxShadow="0 5px 15px rgba(0,0,0,0.18)";
          };

          card.onmouseleave = ()=>{
              card.style.transform="scale(1)";
              card.style.boxShadow="none";
          };


          const canvas = document.createElement("canvas");

          canvas.width = 180;
          canvas.height = 120;

          Object.assign(canvas.style,{
              width:"180px",
              height:"120px",
              border:"1px solid #ccc",
              // borderRadius:"8px",
              display:"block"
          });

          drawCircuitThumbnail(canvas,preset.json);


          const label = document.createElement("div");

          Object.assign(label.style,{
              marginTop:"4px",
              fontSize:"15px",
              fontWeight:"500",
              color:"#333",
              lineHeight:"18px"
          });

          label.textContent = preset.name;


          card.appendChild(canvas);
          card.appendChild(label);


          card.onclick = ()=>{
              loadJSON(preset.json);
              document.body.removeChild(overlay);
          };


          panel.appendChild(card);
      }


      overlay.onclick = e=>{
          if(e.target===overlay)
              document.body.removeChild(overlay);
      };


      overlay.appendChild(panel);
      document.body.appendChild(overlay);
  }
  
  function drawCircuitThumbnail(canvas, circuitData){

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0,0,canvas.width,canvas.height);

      // Build temporary components
      const previewComponents = circuitData.map(c =>
          new Component(
              c.type,
              c.x,
              c.y,
              c.orientation
          )
      );

      // Spawn temporary electrons
      const previewElectrons = [];
      for(const component of previewComponents){
          component.spawnElectrons(previewElectrons);
      }

      // Calculate bounds
      const bounds = getCircuitBounds(previewComponents);

      const margin = 12;

      const scale = Math.min(
          (canvas.width - margin*2) / bounds.width,
          (canvas.height - margin*2) / bounds.height
      );

      const offsetX =
          (canvas.width - bounds.width*scale)/2
          - bounds.left*scale;

      const offsetY =
          (canvas.height - bounds.height*scale)/2
          - bounds.top*scale;

      ctx.save();

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Draw components
      for(const component of previewComponents){
          component.draw(
              ctx,
              [],
              {current:null}
          );
      }

      // Draw electrons
      drawElectrons(ctx, previewElectrons);

      ctx.restore();
  }

  function getCircuitBounds(components){

      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for(const c of components){
          left = Math.min(left, c.x);
          top = Math.min(top, c.y);
          right = Math.max(right, c.x + c.width);
          bottom = Math.max(bottom, c.y + c.height);
      }

      return {
          left,
          top,
          width: right - left,
          height: bottom - top
      };
  }

  function loadJSON(circuitData) {

      // Clear existing circuit
      components.current = [];
      electrons.current = [];

      // Rebuild circuit
      circuitData.forEach(c => {
          addComponent(
              c.type,
              c.orientation,
              c.x,
              c.y,
              false
          );
      });

      forceUpdate(x => x + 1);
  }

  function addComponent(type, orientation="horizontal", x=830, y=30, select=true){
      const component = new Component(type, x, y, orientation);

      components.current.push(component);
      component.spawnElectrons(electrons.current);

      if(type==="bonus-electrons"){
          component.spawnElectrons(electrons.current);
          component.spawnElectrons(electrons.current);
          component.spawnElectrons(electrons.current);
          component.spawnElectrons(electrons.current);
      }

      if(select)
        {selectedObject.current = {type:"component", object:component};
      }
      setTool(null);
      pdSelection.current = [];
      forceUpdate(x=>x+1);
  }
  
  function deleteSelectedObject(){
    const selected = selectedObject.current;

    if(!selected)
      return;

    if(selected.type==="component"){
      const component = selected.object;

      components.current =
        components.current.filter(
          c => c !== component
        );

      electrons.current =
        electrons.current.filter(
          e => !component.contains(e.x,e.y)
        );
    }

    if(selected.type==="ammeter"){
      const ammeter = selected.object;

      ammeters.current =
        ammeters.current.filter(
          a => a !== ammeter
        );
    }

    selectedObject.current = null;
    pdSelection.current = [];
    setTool(null);
    forceUpdate(x=>x+1);
  }

  function clearComponents(){
    components.current = [];
    electrons.current = [];
    ammeters.current = [];
    selectedObject.current = null;
    pdSelection.current = [];
    setTool(null);
    forceUpdate(v=>v+1);
  }

  function electronDensity(component){

    let count = 0;
    for(const electron of electrons.current){
      if(component.contains(
        electron.x,
        electron.y
      )){
        count++;
      }
    }
    const buffer = WALL_BUFFER;
    const usableWidth =
      component.width - buffer*2;
    const usableHeight =
      component.height - buffer*2;
    let area =
      usableWidth * usableHeight;
      if(component.type === "resistor"){
      area *= 4.8;
      }
      else if(component.type === "squarewire"){
      area *= 1.35;
      }
      
    return count / area;
  }

  function checkAmmeterCrossing(electron, ammeter){

    const side1 =
      (ammeter.x2-ammeter.x1) *
      (electron.oldY-ammeter.y1) -
      (ammeter.y2-ammeter.y1) *
      (electron.oldX-ammeter.x1);

    const side2 =
      (ammeter.x2-ammeter.x1) *
      (electron.y-ammeter.y1) -
      (ammeter.y2-ammeter.y1) *
      (electron.x-ammeter.x1);

    if(side1*side2 < 0){

      const inBounds =
        (
          electron.x >= Math.min(ammeter.x1,ammeter.x2) &&
          electron.x <= Math.max(ammeter.x1,ammeter.x2)
        )
        ||
        (
          electron.y >= Math.min(ammeter.y1,ammeter.y2) &&
          electron.y <= Math.max(ammeter.y1,ammeter.y2)
        );

      if(!inBounds)
        return 0;

      if(side1 < 0)
        return 1;
      else
        return -1;
    }

    return 0;
  }


  function ammeterCurrent(ammeter,length=1000){
    const now = performance.now();
    const lastSecond = ammeter.readings.filter(
      r => now-r.time < length
    );
    return lastSecond.reduce(
      (sum,r)=>sum+r.value,
      0
    );
  }


  function drawElectrons(ctx, electrons){
    for(const electron of electrons){

    // Motion trail
    ctx.beginPath();
    ctx.moveTo(
        electron.x,
        electron.y
    );
    ctx.lineTo(
        electron.x - electron.vx * 10,
        electron.y - electron.vy * 10
    );
    ctx.strokeStyle =
        "#4ad5f772";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Electron

    ctx.beginPath();
    ctx.arc(
    electron.x,
    electron.y,
    electron.radius,
    0,
    Math.PI*2
    );

    const g = ctx.createRadialGradient(
    electron.x - electron.radius*0.35,
    electron.y - electron.radius*0.35,
    electron.radius*0.2,
    electron.x,
    electron.y,
    electron.radius
    );
    g.addColorStop(0,"#bff8ff");
    g.addColorStop(0.4,"#5fd6f2");
    g.addColorStop(1,"#0d7ea6");
    ctx.fillStyle = g;
    ctx.fill();
    }
  }

  function drawX(ctx,x,y){
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x-6,y-6);
    ctx.lineTo(x+6,y+6);
    ctx.moveTo(x+6,y-6);
    ctx.lineTo(x-6,y+6);
    ctx.stroke();
    }

//also cheeky computation of pdReading
  function drawPDMeasurement(ctx){
    if(pdSelection.current.length !== 2)
        return;

    const a = pdSelection.current[0];
    const b = pdSelection.current[1];

    const ax = a.x + a.width/2;
    const ay = a.y + a.height/2;

    const bx = b.x + b.width/2;
    const by = b.y + b.height/2;

    ctx.strokeStyle = "green";
    ctx.lineWidth = 3;
    ctx.setLineDash([8,8]);

    ctx.beginPath();
    ctx.moveTo(ax,ay);
    ctx.lineTo(bx,by);
    ctx.stroke();

    // middle arrowhead

    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;

    const angle = Math.atan2(by - ay, bx - ax);
    const arrowSize = 20;

    ctx.setLineDash([]);

    ctx.beginPath();

    ctx.moveTo(mx, my);

    ctx.lineTo(
        mx - arrowSize * Math.cos(angle - Math.PI / 6),
        my - arrowSize * Math.sin(angle - Math.PI / 6)
    );

    ctx.lineTo(
        mx - arrowSize * Math.cos(angle + Math.PI / 6),
        my - arrowSize * Math.sin(angle + Math.PI / 6)
    );

    ctx.closePath();

    ctx.fillStyle = "green";
    ctx.fill();

    drawX(ctx,ax,ay);
    drawX(ctx,bx,by);

    if(pdSelection.current.length===2){


    //also cheeky computation of pdReading
    
      const now = performance.now();
      const densityA = electronDensity(pdSelection.current[0]);
      const densityB = electronDensity(pdSelection.current[1]);

    if(now - pdReading.current.lastDisplayUpdate > 500){
        pdReading.current.densityA = densityA;
        pdReading.current.densityB = densityB;
        pdReading.current.difference = densityA - densityB;

        pdReading.current.lastDisplayUpdate = now;

        forceUpdate(x=>x+1);
      }
      }
  }

  function drawAmmeterReadings(ctx, a){

    const x = Math.max(a.x1,a.x2) + 10;
    const y = a.y2 - 30;

    ctx.fillStyle = "#ff9696c4";
    ctx.strokeStyle = "#aa4a4a";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.roundRect(
      x - 5,
      y - 15,
      110,
      45,
      5
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#511";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";

    ctx.fillText(
      `Last second: ${a.current}`,
      x,
      y
    );

    ctx.fillText(
      `Last 5s: ${a.displayAverage}`,
      x,
      y + 15
    );
  }

  function drawAmmeterBack(ctx,a){
      const cx = (a.x1+a.x2)/2;
      const cy = (a.y1+a.y2)/2;
      const length = Math.hypot(a.x2-a.x1,a.y2-a.y1);
      const angle = Math.atan2(a.y2-a.y1,a.x2-a.x1);
      const rx = length/2;
      const ry = 10;
      ctx.strokeStyle = "rgb(172, 23, 23)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        rx,
        ry,
        angle,
        0,
        Math.PI
      );
      if( selectedObject.current?.type==="ammeter" &&
          selectedObject.current.object===a){
          ctx.fillStyle = "rgba(0,200,255,0.2)";
          ctx.fill();
          }
      ctx.stroke();
    }

  function drawAmmeterFront(ctx,a){
    const cx = (a.x1+a.x2)/2;
    const cy = (a.y1+a.y2)/2;
    const length = Math.hypot(a.x2-a.x1,a.y2-a.y1);
    const angle = Math.atan2(a.y2-a.y1,a.x2-a.x1);
    const rx = length/2;
    const ry = 10;

    ctx.strokeStyle = "rgba(255, 29, 29, 0.9)";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      rx,
      ry,
      angle,
      Math.PI,
      Math.PI*2
    );
    if( selectedObject.current?.type==="ammeter" &&
        selectedObject.current.object===a){
        ctx.fillStyle = "rgba(0,200,255,0.2)";
        ctx.fill();
        }
    ctx.stroke();

    drawAmmeterReadings(ctx,a)
  }

  function drawAmmeterPreview(ctx,start,end){
    const cx = (start.x+end.x)/2;
    const cy = (start.y+end.y)/2;
    const length = Math.hypot(end.x-start.x,end.y-start.y);
    const angle = Math.atan2(end.y-start.y,end.x-start.x);
    const rx = length/2;
    const ry = 10;

    ctx.strokeStyle="rgba(255,0,0,0.5)";
    ctx.lineWidth = 4;
    ctx.setLineDash([5,5]);

    ctx.beginPath();
    ctx.ellipse(cx,cy,rx,ry,angle,0,Math.PI*2);
    ctx.stroke();

    ctx.setLineDash([]);
  }


const components = useRef([]);

  useEffect(() => {
      loadJSON(defaultCircuit);
  }, []);

  useEffect(()=>{
    function keyDown(e){
      if(e.target.tagName==="INPUT")
        return;

      if(e.key==="Delete" || e.key==="Backspace"){
        deleteSelectedObject();
        return;
      }

      if(e.key==="v"){
        pdSelection.current = [];
        // selectedComponent.current = null;
        setTool(tool==="pd" ? null : "pd");
        forceUpdate(v=>v+1);
      }

      if(e.key==="i"){
        pdSelection.current = [];
        // selectedComponent.current = null;
        setTool(tool==="ammeter" ? null : "ammeter");
        toolRef.current = "ammeter"
        forceUpdate(v=>v+1);
      }

      if(e.key==="Escape"){
        setTool(null);
        pdSelection.current = [];
        selectedObject.current = null;
        forceUpdate(x=>x+1);
        return;
      }


    }

    window.addEventListener("keydown", keyDown);

    return ()=>{
      window.removeEventListener("keydown", keyDown);
    };
  },[tool]);

  // useEffect(()=>{
  //   function keyDown(e){
  //     if(e.target.tagName==="INPUT")
  //       return;

  //     if(e.key==="Delete" || e.key==="Backspace")
  //       deleteSelectedObject();
  //   }

  //   window.addEventListener("keydown", keyDown);

  //   return ()=>{
  //     window.removeEventListener("keydown", keyDown);
  //   };
  // },[]);

  useEffect(()=>{
    let animationId;

    const canvas =
      canvasRef.current;
    const ctx =
      canvas.getContext("2d");


    let lastTime = performance.now();

    function frame(time){
      const dt = Math.min((time - lastTime) / 16.67, 2);
      lastTime = time;

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );


      const map =

        buildCircuitMap(
          components.current,
          canvas.width,
          canvas.height
        );

      carryElectrons(
        electrons.current
      );

      applyBatteryForce(
        electrons.current,
        components.current,
        dt
      );

      repelElectrons(
        electrons.current, dt
      );

      // move electrons
      for(const electron of electrons.current){
        electron.oldX = electron.x;
        electron.oldY = electron.y;
        moveElectron(electron,map,dt);
      }

      // measure ammeters

      

      for(const ammeter of ammeters.current){
        for(const electron of electrons.current){
          const crossing = checkAmmeterCrossing(electron, ammeter);
          if(crossing !== 0){
            ammeter.readings.push({
              time: performance.now(),
              value: crossing
            });
          }
        }

        const now = performance.now();
        ammeter.readings = ammeter.readings.filter(r => now-r.time < 5000);
        ammeter.current = ammeterCurrent(ammeter,1000);
        ammeter.average = ammeterCurrent(ammeter,5000);

        if(now - ammeter.lastDisplayUpdate > 500){
          ammeter.displayAverage = ammeter.average;
          ammeter.lastDisplayUpdate = now;
        }
      }


      for(const ammeter of ammeters.current){
        drawAmmeterBack(ctx, ammeter);
      }

      if(toolRef.current==="ammeter" && ammeterStart.current){
        drawAmmeterPreview(
          ctx,
          ammeterStart.current,
          mousePos.current
        );
      }

      // draw components second
      for(
        const component of components.current
      ){
        component.draw(ctx, pdSelection.current, selectedObject);
      }

      // draw generated walls
      if(pdSelection.current.length === 0){
        drawWalls(
            ctx,
            map
        );
        }

      drawElectrons(
        ctx,
        electrons.current
      );
      
      for(const ammeter of ammeters.current){
        drawAmmeterFront(ctx, ammeter);
      }
      
      
      drawPDMeasurement(ctx);
      
          animationId = requestAnimationFrame(frame);
    }
  animationId = requestAnimationFrame(frame);

  return ()=>{
    cancelAnimationFrame(animationId);
  };

  },[]);

function mouseDown(e){
  const rect=canvasRef.current.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  if(tool==="ammeter"){
    if(!ammeterStart.current){
      ammeterStart.current={x,y};
    }
    else{
      const ammeter=new Ammeter(
        ammeterStart.current.x,
        ammeterStart.current.y,
        x,
        y
      );

      ammeters.current.push(ammeter);
      selectedObject.current={
        type:"ammeter",
        object:ammeter
      };
      ammeterStart.current=null;
    }

    forceUpdate(v=>v+1);
    return;
  }

  for(const ammeter of ammeters.current){
    if(ammeter.contains(x,y)){
      selectedObject.current={
        type:"ammeter",
        object:ammeter
      };
      console.log("ready to drag")
      dragging.current=ammeter;
      console.log("dragging set")


      dragOffset.current={
        x:x-ammeter.x1,
        y:y-ammeter.y1
      };

      forceUpdate(v=>v+1);
      return;
    }
  }

  for(const component of components.current){
    if(component.contains(x,y)){

      if(tool==="pd"){
        if(component.type==="battery")
          return;

        if(pdSelection.current.length===2)
          pdSelection.current=[];

        pdSelection.current.push(component);
        forceUpdate(v=>v+1);
        return;
      }

      selectedObject.current={
        type:"component",
        object:component
      };

      dragging.current=component;

      component.placedX=-9999;
      component.placedY=-9999;

      dragOffset.current={
        x:x-component.x,
        y:y-component.y
      };

      grabComponent(
        component,
        electrons.current
      );

      forceUpdate(v=>v+1);
      return;
    }
  }


  // clicked empty space
  selectedObject.current = null;
  pdSelection.current = [];
  setTool(null);
  forceUpdate(v=>v+1);

}


  function mouseMove(e){
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if(dragging.current || tool==="ammeter"){
      mousePos.current = {x,y};
    }

    if(!dragging.current)
      return;

    if(selectedObject.current?.type==="ammeter"){

      const dx = 
        x - dragOffset.current.x - dragging.current.x1;

      const dy =
        y - dragOffset.current.y - dragging.current.y1;

      dragging.current.x1 += dx;
      dragging.current.y1 += dy;
      dragging.current.x2 += dx;
      dragging.current.y2 += dy;

    }
    else{

      dragging.current.x =
        x - dragOffset.current.x;

      dragging.current.y =
        y - dragOffset.current.y;

    }
  }

  function mouseUp(e){
  
    const rect =
      canvasRef.current
      .getBoundingClientRect();
    const x =
      e.clientX -
      rect.left;
    const y =
      e.clientY -
      rect.top;


    // if(tool==="ammeter" && ammeterStart.current){
    //     const ammeter = new Ammeter(
    //         ammeterStart.current.x,
    //         ammeterStart.current.y,
    //         x, 
    //         y);
    //     ammeters.current.push(ammeter);
    //     ammeterStart.current = null;
    //     forceUpdate(v=>v+1);
    //     return;
    //   }

    if(dragging.current){

      dragging.current.placedX =
        dragging.current.x;

      dragging.current.placedY =
        dragging.current.y;

    }

    dragging.current = null;
    forceUpdate(v=>v+1);
    releaseElectrons(
      electrons.current
    );

  }


  return (
    
    <>
        <div>
            <button
            style={{
                background: tool === "pd" ? "green" : "grey",
                color: "white"
            }}
            onClick={()=>{
                pdSelection.current = [];
                setTool(tool === "pd" ? null : "pd");
            }}
            >
            measure p.d. ⚡
            </button>

            <button
              style={{
                background: tool==="ammeter" ? "deepskyblue" : "grey",
                color:"white"
              }}
              onClick={()=>{
                const newTool = tool==="ammeter" ? null : "ammeter";
                setTool(newTool);
                toolRef.current = newTool;
              }}
            >
              measure current 🌊
            </button>
            
            <button 
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("wire","horizontal")}>
                Wire ↔️
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("wire","vertical")}>
                Wire ↕️
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("squarewire","vertical")}>
                Wire ⏹️
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("resistor","horizontal")}>
                Resistor ↔️
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("resistor","vertical")}>
                Resistor  ↕️
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("battery","horizontal")}>
                Battery ➡️
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("battery","vertical")}>
                Battery ⬇️
            </button>
            
            <button
                style={{background:"gold", color:"black"}}
                onClick={()=>addComponent("bonus-electrons","vertical")}>
                Bonus electrons! 🌐
            </button>

            <button
                style={{background:"red", color:"white", height: "23.5px"}}
                onClick={deleteSelectedObject}>
                Delete ✘
            </button>

            <button
              style={{background:"darkred", color:"white"}}
              onClick={clearComponents}
            >
              Clear all 🗑
            </button>

            <button
              style={{background:"black", color:"white"}}
              onClick={() => exportComponents(components)}
            >
              Export circuit 👇
            </button>

            <button
              style={{background:"black", color:"white"}}
              onClick={importCircuit}
            >
              Import circuit ☝️
            </button>
            
            <button
              style={{background:"black", color:"white"}}
              onClick={loadFromPreset}
            >
              Load preset 💾
            </button>
            <button
              style={{background:"white", color:"black"}}
              onClick={showTips}
            >
              Hotkeys 🔥
            </button>
        </div>


{/*   slider */}
        
        {selectedObject.current !== null &&
        selectedObject.current.type === "component" &&
        selectedObject.current.object.type==="battery" &&
        !dragging.current && (
        <div
            style={{
            pointerEvents: "none",
            position: "absolute",

            left:
              selectedObject.current.object.orientation === "vertical"
              ? canvasRect.left +
                (
                  selectedObject.current.object.x +
                  selectedObject.current.object.width - 40
                ) * scaleX
              : canvasRect.left +
                (
                  selectedObject.current.object.x + 40
                ) * scaleX,

            top:
                selectedObject.current.object.orientation === "vertical"
                ? selectedObject.current.object.y +
                    selectedObject.current.object.height/2 - 30
                : selectedObject.current.object.y +
                    selectedObject.current.object.height + 40
            }}
        >
            <input
            type="range"
            min="-3"
            max="3"
            step="0.5"
            value={selectedObject.current.object.voltage}
            onMouseDown={(e)=>{
                e.stopPropagation();
            }}
            onChange={(e)=>{
                selectedObject.current.object.voltage =
                Number(e.target.value);
                forceUpdate(v=>v+1);
            }}
            style={{
                pointerEvents:"auto",
                height:
                selectedObject.current.object.orientation === "vertical"
                    ? "100px"
                    : undefined,
                width:
                selectedObject.current.object.orientation === "horizontal"
                    ? "100px"
                    : undefined,
                transform:
                selectedObject.current.object.orientation === "vertical"
                    ? "rotate(270deg)"
                    : "none"
            }}
            />

            <div
            style={{
                textAlign: "center",
                fontWeight: "bold",
                marginTop: "4px"
            }}
            >
            {selectedObject.current.object.voltage} V
            </div>
        </div>
        )}


{/* pd readings display*/}
        {pdSelection.current.length === 2 && (
        <div
            style={{
            color:"black",
            position:"absolute",
            left:"10px",
            top:"33px",
            background:"dark grey",
            padding:"3px",
            width:"00px",
            textAlign:"right",
            fontSize:"14px",
            zIndex:10
            }}
        >
{/* pd readings display */}
{pdSelection.current.length === 2 && (
  <div
    style={{
      position:"absolute",
      left:"40px",
      top:"33px",
      zIndex:10
    }}
  >
    <div
      style={{
        background:"#dff5df",
        border:"2px solid #5a8f5a",
        borderRadius:"5px",
        padding:"5px 7px",
        width:"180px",
        boxSizing:"border-box",
        textAlign:"right",
        fontFamily:"monospace",
        fontSize:"12px",
        lineHeight:"1.4",
        boxShadow:"inset 0 0 6px rgba(0,80,0,0.2)",
        color:"#123"
      }}
    >
      <div>
        Component 1: {(pdReading.current.densityA*100).toPrecision(2)} V
      </div>

      <div>
        Component 2: {(pdReading.current.densityB*100).toPrecision(2)} V
      </div>

      <div
        style={{
          marginTop:"3px",
          paddingTop:"3px",
          borderTop:"1px solid #8ab58a",
          fontWeight:"bold"
        }}
      >
        Difference: {(pdReading.current.difference*100).toFixed(2)} V
      </div>
    </div>
  </div>
)}
        </div>
        )}

        <canvas

        ref={canvasRef}
        width={1100}
        height={600}
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}
        style={{
            width:"1100px",
            height:"600px",
            border:
            "1px solid black",
            background:
            "#fafafa"
        }}

        />
    </>
  );

}