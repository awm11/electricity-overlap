import { useEffect, useRef } from "react";

const ElectronDensity = 0.0010;
const GRID_SIZE = 4;
const ELECTRON_RADIUS = 3;
const WALL_BUFFER = ELECTRON_RADIUS + 10;


class Electron {

  constructor(x, y) {

    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5);
    this.vy = (Math.random() - 0.5);
    this.radius = ELECTRON_RADIUS;
    this.carried = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.carrier = null;
  }

}



class Component {

  constructor(type, x, y, width, height) {

    this.id = crypto.randomUUID();
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }



  contains(x,y){
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );

  }



  spawnElectrons(electrons){

    const count =
      Math.floor(
        this.width *
        this.height *
        ElectronDensity
      );


    for(let i=0;i<count;i++){

      electrons.push(

        new Electron(
          this.x +
          Math.random()*this.width,

          this.y +
          Math.random()*this.height
        )

      );

    }

  }



  draw(ctx){

    ctx.lineWidth = 4;

    if(this.type==="battery")
      ctx.strokeStyle="#b33";

    else if(this.type==="resistor")
      ctx.strokeStyle="#333";

    else
      ctx.strokeStyle="#888";


    ctx.strokeRect(
      this.x,
      this.y,
      this.width,
      this.height
    );


    ctx.fillStyle="#000";

    ctx.fillText(
      this.type,
      this.x + 5,
      this.y - 8
    );

  }

}





function buildCircuitMap(
  components,
  width,
  height
){

  const cols =
    Math.ceil(width / GRID_SIZE);

  const rows =
    Math.ceil(height / GRID_SIZE);



  const map =
    Array.from(
      {length: rows},
      ()=>Array(cols).fill(false)
    );



  for(const c of components){

    const x1 =
      Math.floor(c.x / GRID_SIZE);

    const x2 =
      Math.floor(
        (c.x+c.width) /
        GRID_SIZE
      );


    const y1 =
      Math.floor(c.y / GRID_SIZE);

    const y2 =
      Math.floor(
        (c.y+c.height) /
        GRID_SIZE
      );



    for(let y=y1;y<=y2;y++){

      for(let x=x1;x<=x2;x++){

        if(map[y]?.[x] !== undefined){

          map[y][x]=true;

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


  return map[gy]?.[gx] ?? false;

}




function moveElectron(
  electron,
  map
){

  if(electron.carried)
    return;


  const nextX =
    electron.x + electron.vx;

  const nextY =
    electron.y + electron.vy;



  const canMoveX =
    insideCircuit(
      nextX +
      Math.sign(electron.vx) *
      WALL_BUFFER,

      electron.y,

      map
    );


  const canMoveY =
    insideCircuit(
      electron.x,

      nextY +
      Math.sign(electron.vy) *
      WALL_BUFFER,

      map
    );



  if(canMoveX){

    electron.x = nextX;

  }
  else{

    electron.vx *= -1;

  }



  if(canMoveY){

    electron.y = nextY;

  }
  else{

    electron.vy *= -1;

  }

}




function repelElectrons(electrons){

  const mediumRange = 80;
  const repulsionStrength = 0.02;
  const VelocityDamping = 0.995;

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

        a.vx -= nx*force;
        a.vy -= ny*force;

        b.vx += nx*force;
        b.vy += ny*force;
      }

      // Hard collision separation
      const minimum = a.radius+b.radius;

      if(distance < minimum){

        const push =
          (minimum-distance)*0.05;

        a.x -= nx*push;
        a.y -= ny*push;

        b.x += nx*push;
        b.y += ny*push;
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

      electron.carried = true;

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

  const canvasRef =
    useRef(null);



  const components =
    useRef([

      new Component(
        "wire",
        100,
        150,
        300,
        60
      ),


      new Component(
        "resistor",
        500,
        150,
        200,
        25
      ),


      new Component(
        "battery",
        350,
        350,
        120,
        180
      )

    ]);



  const electrons =
    useRef([]);



  const dragging =
    useRef(null);



  const dragOffset =
    useRef({
      x:0,
      y:0
    });




  useEffect(()=>{

    for(const component of components.current){

      component.spawnElectrons(
        electrons.current
      );

    }


  },[]);






  useEffect(()=>{


    const canvas =
      canvasRef.current;


    const ctx =
      canvas.getContext("2d");



    function frame(){


      ctx.fillStyle = "white";
      ctx.fillRect(
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



      for(const electron of electrons.current){

        moveElectron(
          electron,
          map
        );

      }



      repelElectrons(
        electrons.current
      );




      for(const component of components.current){
        component.draw(ctx);
        const rows = map.length;
        const cols = map[0].length;

        ctx.lineWidth = 3;

        for(let y=0;y<rows;y++){

          for(let x=0;x<cols;x++){

            if(
              map[y][x] &&
              isInternalWall(x,y,map)
            ){

              ctx.strokeStyle = "cyan";

              ctx.strokeRect(
                x * GRID_SIZE,
                y * GRID_SIZE,
                GRID_SIZE,
                GRID_SIZE
              );

            }

          }

        }
      }



      for(const electron of electrons.current){


        ctx.beginPath();


        ctx.arc(
          electron.x,
          electron.y,
          electron.radius,
          0,
          Math.PI*2
        );


        ctx.fillStyle =
          "#111";


        ctx.fill();

      }



      requestAnimationFrame(frame);

    }


    frame();


  },[]);







  function mouseDown(e){


    const rect =
      canvasRef.current
      .getBoundingClientRect();


    const x =
      e.clientX -
      rect.left;


    const y =
      e.clientY -
      rect.top;



    for(const component of components.current){


      if(
        component.contains(
          x,
          y
        )
      ){

        dragging.current =
          component;



        dragOffset.current = {

          x:
          x-component.x,


          y:
          y-component.y

        };



        grabComponent(
          component,
          electrons.current
        );


        break;

      }

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



  function isInternalWall(x,y,map){
    if(isWallCell)
      return false;
    const left = map[y]?.[x-1];
    const right = map[y]?.[x+1];
    const up = map[y-1]?.[x];
    const down = map[y+1]?.[x];

    
    return (
      (left && right) ||
      (up && down)
    );

  }

  function isWallCell(x,y,map){

    const left = map[y]?.[x-1];
    const right = map[y]?.[x+1];
    const up = map[y-1]?.[x];
    const down = map[y+1]?.[x];

    return (
      !left ||
      !right ||
      !up ||
      !down
    );

  }

  function mouseUp(){


    dragging.current=null;


    releaseElectrons(
      electrons.current
    );
  }
  return (

    <canvas
      ref={canvasRef}
      width={900}
      height={600}
      

      onMouseDown={mouseDown}

      onMouseMove={mouseMove}

      onMouseUp={mouseUp}


      style={{
        width:"900px",
        height:"600px",
        border:"1px solid black"
      }}

    />

  );

}