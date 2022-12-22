"use strict";

var canvas;
var gl;

var modelViewMatrix, projectionMatrix , instanceMatrix;
var viewerPos;
var program1, program2, program3;
let modelViewMatrixLoc;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;

let theta = [0, 0, 0, 0, 0, 0, 180, 0, 180, 0, 0]

var flag = false;
let shady = 0
const torsoId = 0
const headId = 1
const head1Id = 1
const head2Id = 10
const leftUpperArmId = 2
const leftLowerArmId = 3
const rightUpperArmId = 4
const rightLowerArmId = 5
const leftUpperLegId = 6
const leftLowerLegId = 7
const rightUpperLegId = 8
const rightLowerLegId = 9

const torsoHeight = 5.0
const torsoWidth = 1.0
const upperArmHeight = 3.0
const lowerArmHeight = 2.0
const upperArmWidth = 0.5
const lowerArmWidth = 0.5
const upperLegWidth = 0.5
const lowerLegWidth = 0.5
const lowerLegHeight = 2.0
const upperLegHeight = 3.0
const headHeight = 1.5
const headWidth = 1.0

const numNodes = 10
var points = [];
var normals = [];
var colors = [];
var texCoord = [];
const stack = []

const figure = []
var ncube;


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);

// specify objects and instance them
for (let i = 0; i < numNodes; i++) {
  figure[i] = createNode(null, null, null, null)
}

    var myCube = cube(1);
    // myCube.rotate(360.0, [1, 1, 1]);
    myCube.translate(0.7, 0.0, 0.0);


// light, material, texture

    var myMaterial = goldMaterial();
    var myLight = light0();
    var texture = checkerboardTexture();

// put object data in arrays that will be sent to shaders


    points = points.concat(myCube.TriangleVertices);
    normals = normals.concat(myCube.TriangleNormals);
    colors = colors.concat(myCube.TriangleVertexColors);
    texCoord = texCoord.concat(myCube.TextureCoordinates);
   
// object sizes (number of vertices)

    ncube = myCube.TriangleVertices.length;
    

    //
    //  Load shaders and initialize attribute buffers
    //
    program1 = initShaders( gl, "vertex-shader", "fragment-shader" );
    program2 = initShaders( gl, "vertex-shader2", "fragment-shader2" );
    program3 = initShaders( gl, "vertex-shader3", "fragment-shader3" );

// program1: render with lighting
//    need position and normal attributes sent to shaders
// program2: render with vertex colors
//    need position and color attributes sent to shaders
// program3: render with texture and vertex colors
//    need position, color and texture coordinate attributes sent to shaders

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation( program2, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( colorLoc );

    var color2Loc = gl.getAttribLocation( program3, "aColor" );
    gl.vertexAttribPointer( color2Loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( color2Loc );

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var normalLoc = gl.getAttribLocation( program1, "aNormal" );
    gl.vertexAttribPointer( normalLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( normalLoc );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var positionLoc = gl.getAttribLocation(program1, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var position2Loc = gl.getAttribLocation(program2, "aPosition");
    gl.vertexAttribPointer(position2Loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position2Loc);

    var position3Loc = gl.getAttribLocation(program3, "aPosition");
    gl.vertexAttribPointer(position3Loc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position3Loc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW );

    var texCoordLoc = gl.getAttribLocation( program3, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

// set up projection matrix

    viewerPos = vec3(0.0, 0.0, -20.0 );

    instanceMatrix = mat4()
    projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0)
    modelViewMatrix = mat4()

// products of material and light properties

    var ambientProduct = mult(myLight.lightAmbient, myMaterial.materialAmbient);
    var diffuseProduct = mult(myLight.lightDiffuse, myMaterial.materialDiffuse);
    var specularProduct = mult(myLight.lightSpecular, myMaterial.materialSpecular);

// listeners

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    document.getElementById("ButtonS").onclick = function(){shady = (shady + 1) %3;};
    document.getElementById('slider0').onchange = function (event) {
      theta[torsoId] = event.target.value
      initNodes(torsoId)
    }
    document.getElementById('slider1').onchange = function (event) {
      theta[head1Id] = event.target.value
      initNodes(head1Id)
    }
    document.getElementById('slider2').onchange = function (event) {
      theta[leftUpperArmId] = event.target.value
      initNodes(leftUpperArmId)
    }
    document.getElementById('slider3').onchange = function (event) {
      theta[leftLowerArmId] = event.target.value
      initNodes(leftLowerArmId)
    }
    document.getElementById('slider4').onchange = function (event) {
      theta[rightUpperArmId] = event.target.value
      initNodes(rightUpperArmId)
    }
    document.getElementById('slider5').onchange = function (event) {
      theta[rightLowerArmId] = event.target.value
      initNodes(rightLowerArmId)
    }
    document.getElementById('slider6').onchange = function (event) {
      theta[leftUpperLegId] = event.target.value
      initNodes(leftUpperLegId)
    }
    document.getElementById('slider7').onchange = function (event) {
      theta[leftLowerLegId] = event.target.value
      initNodes(leftLowerLegId)
    }
    document.getElementById('slider8').onchange = function (event) {
      theta[rightUpperLegId] = event.target.value
      initNodes(rightUpperLegId)
    }
    document.getElementById('slider9').onchange = function (event) {
      theta[rightLowerLegId] = event.target.value
      initNodes(rightLowerLegId)
    }
    document.getElementById('slider10').onchange = function (event) {
      theta[head2Id] = event.target.value
      initNodes(head2Id)
    }

// uniforms for each program object

    gl.useProgram(program2);
   // gl.uniformMatrix4fv(gl.getUniformLocation(program2, 'modelViewMatrix'), false, flatten(modelViewMatrix))
    gl.uniformMatrix4fv( gl.getUniformLocation(program2, "projectionMatrix"),
       false, flatten(projectionMatrix));
           
    //comment this line to see other shader effect in robot and uncomment   modelViewMatrixLoc to either for program2 or program 3
   // modelViewMatrixLoc = gl.getUniformLocation(program2, 'modelViewMatrix')


    

    gl.useProgram(program3);
    //gl.uniformMatrix4fv(gl.getUniformLocation(program3, 'modelViewMatrix'), false, flatten(modelViewMatrix))
    gl.uniformMatrix4fv( gl.getUniformLocation(program3, "projectionMatrix"),
          false, flatten(projectionMatrix));
              
    //comment this line to see other shader effect in robot and uncomment   modelViewMatrixLoc to either for program2 or program 3
      //  modelViewMatrixLoc = gl.getUniformLocation(program3, 'modelViewMatrix')


     




    gl.useProgram(program1);

    gl.uniform4fv(gl.getUniformLocation(program1, "ambientProduct"),
          flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program1, "diffuseProduct"),
          flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program1, "specularProduct"),
          flatten(specularProduct) );
    gl.uniform4fv(gl.getUniformLocation(program1, "lightPosition"),
          flatten(myLight.lightPosition) );

    gl.uniform1f(gl.getUniformLocation(program1,
          "shininess"), myMaterial.materialShininess);

          
    //  gl.uniformMatrix4fv(gl.getUniformLocation(program1, 'modelViewMatrix'), false, flatten(modelViewMatrix))
    gl.uniformMatrix4fv( gl.getUniformLocation(program1, "projectionMatrix"),false, flatten(projectionMatrix));
    
    //comment this line to see other shader effect in robot and uncomment   modelViewMatrixLoc to either for program2 or program 3
    modelViewMatrixLoc = gl.getUniformLocation(program1, 'modelViewMatrix')


          for (let i = 0; i < numNodes; i++) {
            initNodes(i)
          }



    render();
}


function initNodes (Id) {
  let m = mat4()
  switch (Id) {
    case torsoId:
      m = rotate(theta[torsoId], vec3(0, 1, 0))
      figure[torsoId] = createNode(m, torso, null, headId)
      break
    case headId:
    case head1Id:
    case head2Id:
      m = translate(0.0, torsoHeight + 0.5 * headHeight, 0.0)
      m = mult(m, rotate(theta[head1Id], vec3(1, 0, 0)))
      m = mult(m, rotate(theta[head2Id], vec3(0, 1, 0)))
      m = mult(m, translate(0.0, -0.5 * headHeight, 0.0))
      figure[headId] = createNode(m, head, leftUpperArmId, null)
      break
    case leftUpperArmId:
      m = translate(-(torsoWidth + upperArmWidth), 0.9 * torsoHeight, 0.0)
      m = mult(m, rotate(theta[leftUpperArmId], vec3(1, 0, 0)))
      figure[leftUpperArmId] = createNode(m, leftUpperArm, rightUpperArmId, leftLowerArmId)
      break
    case rightUpperArmId:
      m = translate(torsoWidth + upperArmWidth, 0.9 * torsoHeight, 0.0)
      m = mult(m, rotate(theta[rightUpperArmId], vec3(1, 0, 0)))
      figure[rightUpperArmId] = createNode(m, rightUpperArm, leftUpperLegId, rightLowerArmId)
      break
    case leftUpperLegId:
      m = translate(-(torsoWidth + upperLegWidth), 0.1 * upperLegHeight, 0.0)
      m = mult(m, rotate(theta[leftUpperLegId], vec3(1, 0, 0)))
      figure[leftUpperLegId] = createNode(m, leftUpperLeg, rightUpperLegId, leftLowerLegId)
      break
    case rightUpperLegId:
      m = translate(torsoWidth + upperLegWidth, 0.1 * upperLegHeight, 0.0)
      m = mult(m, rotate(theta[rightUpperLegId], vec3(1, 0, 0)))
      figure[rightUpperLegId] = createNode(m, rightUpperLeg, null, rightLowerLegId)
      break
    case leftLowerArmId:
      m = translate(0.0, upperArmHeight, 0.0)
      m = mult(m, rotate(theta[leftLowerArmId], vec3(1, 0, 0)))
      figure[leftLowerArmId] = createNode(m, leftLowerArm, null, null)
      break
    case rightLowerArmId:
      m = translate(0.0, upperArmHeight, 0.0)
      m = mult(m, rotate(theta[rightLowerArmId], vec3(1, 0, 0)))
      figure[rightLowerArmId] = createNode(m, rightLowerArm, null, null)
      break
    case leftLowerLegId:
      m = translate(0.0, upperLegHeight, 0.0)
      m = mult(m, rotate(theta[leftLowerLegId], vec3(1, 0, 0)))
      figure[leftLowerLegId] = createNode(m, leftLowerLeg, null, null)
      break
    case rightLowerLegId:
      m = translate(0.0, upperLegHeight, 0.0)
      m = mult(m, rotate(theta[rightLowerLegId], vec3(1, 0, 0)))
      figure[rightLowerLegId] = createNode(m, rightLowerLeg, null, null)
      break
  }
}

function createNode (transform, render, sibling, child) {
  const node = { transform, render, sibling, child }
  return node
}

function traverse (Id) {
  if (Id == null) {
    return
  }
  stack.push(modelViewMatrix)
  modelViewMatrix = mult(modelViewMatrix, figure[Id].transform)
  figure[Id].render()
  if (figure[Id].child != null) {
    traverse(figure[Id].child)
  }
  modelViewMatrix = stack.pop()
  if (figure[Id].sibling != null) {
    traverse(figure[Id].sibling)
  }
}

function torso () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * torsoHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(torsoWidth, torsoHeight, torsoWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function head () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function leftUpperArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function leftLowerArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function rightUpperArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function rightLowerArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function leftUpperLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function leftLowerLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function rightUpperLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}

function rightLowerLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    
    gl.drawArrays( gl.TRIANGLES ,0, ncube );
  }
}




var render = function(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//update rotation angles and form modelView matrix

    if(flag) theta[axis] += 2.0;

    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0) ));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0) ));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1) ));

// by commenting and uncommenting gl.drawArrays we can choose which shaders to use for each object

    switch (shady) {
      case 0:
        gl.useProgram(program1);
        gl.uniformMatrix4fv( gl.getUniformLocation(program1,
                "modelViewMatrix"), false, flatten(modelViewMatrix) );
      //  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
       gl.drawArrays( gl.TRIANGLES, 0, ncube );
        break
      case 1:
        gl.useProgram(program2);
        gl.uniformMatrix4fv( gl.getUniformLocation(program2,
                "modelViewMatrix"), false, flatten(modelViewMatrix) );
       // gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
               gl.drawArrays( gl.TRIANGLES, 0, ncube );
        break
      case 2:
        gl.useProgram(program3);
        gl.uniformMatrix4fv( gl.getUniformLocation(program3,
                "modelViewMatrix"), false, flatten(modelViewMatrix) );
        //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))

        gl.drawArrays( gl.TRIANGLES ,0, ncube );

        break
      }




      traverse(torsoId)

    requestAnimationFrame(render);
}