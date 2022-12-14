'use strict'

var canvas;
var gl;
var numPositions  = 36;


var program;
var flag = false;


var color = new Uint8Array(4);


let projectionMatrix, modelViewMatrix, instanceMatrix
let modelViewMatrixLoc

const vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, 0.5, 0.5, 1.0),
  vec4(0.5, 0.5, 0.5, 1.0),
  vec4(0.5, -0.5, 0.5, 1.0),
  vec4(-0.5, -0.5, -0.5, 1.0),
  vec4(-0.5, 0.5, -0.5, 1.0),
  vec4(0.5, 0.5, -0.5, 1.0),
  vec4(0.5, -0.5, -0.5, 1.0)
]
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;
var ctm;
var viewerPos;
var ambientColor, diffuseColor, specularColor;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;
var Index = 0;
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
// const numAngles = 11
// const angle = 0

let theta = [0, 0, 0, 0, 0, 0, 180, 0, 180, 0, 0]

// const numVertices = 24

const stack = []

const figure = []

const pointsArray = []
var normalsArray = [];
var framebuffer;

window.onload = function init () {
  canvas = document.getElementById('gl-canvas')
  gl = canvas.getContext('webgl2')
  if (!gl) {
    alert('WebGL 2.0 is not available')
  }

  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(0.5, 0.5, 0.5, 1.0)

  gl.enable(gl.CULL_FACE);
  

  var texture = gl.createTexture();
  gl.bindTexture( gl.TEXTURE_2D, texture );
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0,
     gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.generateMipmap(gl.TEXTURE_2D);

  // Allocate a frame buffer object

  framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);

  // Attach color buffer
  

  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  //  Load shaders and initialize attribute buffers
  program = initShaders(gl, 'vertex-shader', 'fragment-shader')
  gl.useProgram(program)

 

  cube()

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer );
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var normalLoc =gl.getAttribLocation( program, "aNormal");
  gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(normalLoc);

  
  const vBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW)



  const positionLoc = gl.getAttribLocation(program, 'aPosition')
  gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(positionLoc);

  viewerPos = vec3(0.0, 0.0, -20.0 );
  instanceMatrix = mat4()
  projectionMatrix = ortho(-10.0, 10.0, -10.0, 10.0, -10.0, 10.0)
  modelViewMatrix = mat4()

  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), false, flatten(modelViewMatrix))
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, flatten(projectionMatrix))

  modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix')

  for (let i = 0; i < numNodes; i++) {
    figure[i] = createNode(null, null, null, null)
  }
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);


  // event listner buttons
  document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
  document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
  document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
  document.getElementById("ButtonT").onclick = function(){flag = !flag};
 
 
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

  for (let i = 0; i < numNodes; i++) {
    initNodes(i)
  }
  
  gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
  ambientProduct);
gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
  diffuseProduct );
gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
  specularProduct );
gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
  lightPosition );

gl.uniform1f(gl.getUniformLocation(program,
  "uShininess"), materialShininess);

gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
  false, flatten(projectionMatrix) );



  canvas.addEventListener("mousedown", function(event){

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);
    for(var i=0; i<6; i++) {
        gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);
        gl.drawArrays( gl.TRIANGLES, 6*i, 6 );
    }
    var x = event.clientX;
    var y = canvas.height-event.clientY;

    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

    if(color[0]==255)
    if(color[1]==255) console.log("front");
    else if(color[2]==255) console.log("back");
    else console.log("right");
    else if(color[1]==255)
    if(color[2]==255) console.log("left");
    else console.log("top");
    else if(color[2]==255) console.log("bottom");
    else console.log("background");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), 0);
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.uniform3fv(thetaLoc, theta);
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

});
  render()
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
    // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function head () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * headHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(headWidth, headHeight, headWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftUpperArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftLowerArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
   // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightUpperArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperArmWidth, upperArmHeight, upperArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
    //gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightLowerArm () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerArmHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerArmWidth, lowerArmHeight, lowerArmWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
   // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftUpperLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
   // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function leftLowerLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
   // gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightUpperLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * upperLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(upperLegWidth, upperLegHeight, upperLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
  //  gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function rightLowerLeg () {
  instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.5 * lowerLegHeight, 0.0))
  instanceMatrix = mult(instanceMatrix, scale(lowerLegWidth, lowerLegHeight, lowerLegWidth))
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix))
  for (let i = 0; i < 6; i++) {
  //  gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);//uncomment to change the color
    gl.drawArrays(gl.TRIANGLE_FAN, 4 * i, 4)
  }
}

function cube () {
  quad(1, 0, 3, 2)
  quad(2, 3, 7, 6)
  quad(3, 0, 4, 7)
  quad(6, 5, 1, 2)
  quad(4, 5, 6, 7)
  quad(5, 4, 0, 1)
}

function quad (a, b, c, d) {
  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = cross(t1, t2);
  normal = normalize(normal);


  pointsArray.push(vertices[a])
  normalsArray.push(normal);

  pointsArray.push(vertices[b])
  normalsArray.push(normal);

  pointsArray.push(vertices[c]);
  normalsArray.push(normal);

  // pointsArray.push(vertices[a]) // uncoment to broke the robot

  // normalsArray.push(normal); // uncoment to broke the robot

  // pointsArray.push(vertices[c]); // uncoment to broke the robot

  // normalsArray.push(normal); // uncoment to broke the robot


  pointsArray.push(vertices[d])
  normalsArray.push(normal);
}

function render () {
  gl.clear(gl.COLOR_BUFFER_BIT)
 

  traverse(torsoId)
  window.requestAnimationFrame(render)
}