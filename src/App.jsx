import { useEffect, useRef, useState } from "react";
const ElectronDensity = 0.0030;
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
    draw(ctx, pdSelection){

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


    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.fillText(
        this.type,
        this.x + 5,
        this.y - 5
    );    
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
console.log(dt);
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
  const VelocityDamping = Math.pow(0.995, dt);

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
  const canvasRef = useRef(null);
  const selectedComponent = useRef(null);
  const [, forceUpdate] = useState(0);
  const canvasRect =  canvasRef.current?.getBoundingClientRect();
  const scaleX = canvasRect
    ? canvasRect.width / canvasRef.current.width
    : 1;
  const scaleY = canvasRect
    ? canvasRect.height / canvasRef.current.height
    : 1;
  const pdSelection = useRef([]);

  function addComponent(type, orientation="horizontal"){
    const component = new Component(type,830,30,orientation);
    components.current.push(component);
    component.spawnElectrons(electrons.current);
    selectedComponent.current = component;
    setTool(null);
    pdSelection.current = [];
    forceUpdate(x=>x+1);
    }

  function deleteSelectedComponent(){
    const component =
      selectedComponent.current;

    if(!component)
      return;

    components.current = components.current.filter(
      c => c !== component
      );
    electrons.current = electrons.current.filter(
        e => !component.contains(e.x,e.y)
      );
    selectedComponent.current = null;
    pdSelection.current = [];
    setTool(null);
    forceUpdate(x=>x+1);
  }

  function clearComponents(){
    components.current = [];
    electrons.current = [];
    selectedComponent.current = null;
    pdSelection.current = [];
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
    
  return count / area;
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

}

//pd calc constants
    const densityA =
    pdSelection.current[0]
    ? electronDensity(pdSelection.current[0])
    : 0;

    const densityB =
    pdSelection.current[1]
    ? electronDensity(pdSelection.current[1])
    : 0;

    const difference =
    densityA - densityB;
    
// other constants

  const components =
    useRef([

    new Component(
    "battery",
    550,
    350,
    "vertical"
    ),

    new Component(
    "wire",
    100,
    150
    ),

    new Component(
    "wire",
    200,
    450
    ),

    new Component(
    "resistor",
    500,
    150,
    "vertical"
    )

    ]);



  useEffect(()=>{
    for(
      const component of components.current
    ){
      component.spawnElectrons(
        electrons.current
      );
    }
  },[]);

  useEffect(()=>{
    function keyDown(e){
      if(e.target.tagName==="INPUT")
        return;

      if(e.key==="Delete" || e.key==="Backspace")
        deleteSelectedComponent();
    }

    window.addEventListener("keydown", keyDown);

    return ()=>{
      window.removeEventListener("keydown", keyDown);
    };
  },[]);

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

      for(
        const electron of electrons.current
      ){

        moveElectron(
          electron,
          map,
          dt
        );
      }


      // draw components first
      for(
        const component of components.current
      ){
        component.draw(ctx, pdSelection.current);
      }

      // draw generated walls
      if(pdSelection.current.length === 0){
        drawWalls(
            ctx,
            map
        );
        }

        // draw electrons

        for(const electron of electrons.current){

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
      
      drawPDMeasurement(ctx);
      
          animationId = requestAnimationFrame(frame);
    }
  animationId = requestAnimationFrame(frame);

  return ()=>{
    cancelAnimationFrame(animationId);
  };

  },[]);





  function mouseDown(e){
    // alert("reached mouseDown")

    const rect =
      canvasRef.current
      .getBoundingClientRect();
    const x =
      e.clientX -
      rect.left;
    const y =
      e.clientY -
      rect.top;
    for(
      const component of components.current
    ){

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


        selectedComponent.current = component;
        dragging.current = component;
        forceUpdate(v=>v+1);
          component.placedX = -9999;
          component.placedY = -9999;
        dragOffset.current = {
          x:
          x - component.x,
          y:
          y - component.y
        };
        grabComponent(
          component,
          electrons.current
        );
        return;

      }
      
    }
        
  if(tool==="pd"){
    pdSelection.current=[];
    setTool(null);
    forceUpdate(v=>v+1);
      }
  }




  function mouseMove(e){
    if(!dragging.current)
      return;
    const rect =
      canvasRef.current
      .getBoundingClientRect();
    dragging.current.x =
      e.clientX -
      rect.left -
      dragOffset.current.x;
    dragging.current.y =
      e.clientY -
      rect.top -
      dragOffset.current.y;
  }





  function mouseUp(){

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
            measure p.d.
            </button>
            <button 
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("wire","horizontal")}>
                Wire ↔
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("wire","vertical")}>
                Wire ↕ 
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("resistor","horizontal")}>
                Resistor ↔
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("resistor","vertical")}>
                Resistor  ↕ 
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("battery","horizontal")}>
                Battery →
            </button>

            <button
                style={{background:"blue", color:"white"}}
                onClick={()=>addComponent("battery","vertical")}>
                Battery ↓
            </button>
            
            <button
                style={{background:"red", color:"white"}}
                onClick={deleteSelectedComponent}>
                
                Delete
            </button>

            <button
              style={{background:"darkred", color:"white"}}
              onClick={clearComponents}
            >
              Clear all
            </button>
        </div>


{/*   slider */}
        {selectedComponent.current?.type === "battery" &&!dragging.current && (
        <div
            style={{
            pointerEvents: "none",
            position: "absolute",

            left:
              selectedComponent.current.orientation === "vertical"
              ? canvasRect.left +
                (
                  selectedComponent.current.x +
                  selectedComponent.current.width - 40
                ) * scaleX
              : canvasRect.left +
                (
                  selectedComponent.current.x + 40
                ) * scaleX,

            top:
                selectedComponent.current.orientation === "vertical"
                ? selectedComponent.current.y +
                    selectedComponent.current.height/2 - 30
                : selectedComponent.current.y +
                    selectedComponent.current.height + 40
            }}
        >
            <input
            type="range"
            min="-3"
            max="3"
            step="0.5"
            value={selectedComponent.current.voltage}
            onMouseDown={(e)=>{
                e.stopPropagation();
            }}
            onChange={(e)=>{
                selectedComponent.current.voltage =
                Number(e.target.value);
                forceUpdate(v=>v+1);
            }}
            style={{
                pointerEvents:"auto",
                height:
                selectedComponent.current.orientation === "vertical"
                    ? "100px"
                    : undefined,
                width:
                selectedComponent.current.orientation === "horizontal"
                    ? "100px"
                    : undefined,
                transform:
                selectedComponent.current.orientation === "vertical"
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
            {selectedComponent.current.voltage} V
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
            background:"white",
            border:"1px solid black",
            padding:"3px",
            width:"200px",
            textAlign:"right",
            fontSize:"14px",
            zIndex:10
            }}
        >
            <div>Component 1: {(densityA*100).toPrecision(2)} "volts" </div>
            <div>Component 2: {(densityB*100).toPrecision(2)} "volts" </div>
            <div>Difference: {(difference*100).toPrecision(2)} "volts" </div>
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