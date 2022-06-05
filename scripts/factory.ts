import Scene from 'Scene';
import Materials from 'Materials';
import Textures from 'Textures';
import CameraInfo from 'CameraInfo';
import Shaders from 'Shaders';
import Reactive from 'Reactive';
import Diagnostics from 'Diagnostics';
import Segmentation from 'Segmentation';

import {
  ObjectTypes,
  IPlaneAttrubutes,
  IMaterialAttributes,
  MaterialTypes,
  IRectangleAttributes,
} from './constants';
import Util from './util';
import AnimationCenter from './animation';
import TimeModule from 'Time';
import FaceTracking from 'FaceTracking';

export default class Factory {
  private util: Util;
  private anime: AnimationCenter;
  private fD: FocalDistance;
  private faceTransform: TransformSignal;

  constructor({ focalDistance }: { focalDistance?: FocalDistance }) {
    this.util = new Util();
    this.anime = new AnimationCenter();
    this.fD = focalDistance;
    this.faceTransform = FaceTracking.face(0).cameraTransform;
  }

  async findMaterial({ name }: { name: string }): Promise<MaterialBase> {
    return Materials.findFirst(name);
  }

  async findMaterials({ prefix }: { prefix: string }) {
    return Materials.findUsingPattern(`${prefix}*`);
  }

  async findTexture({ name }: { name: string }): Promise<TextureBase> {
    return Textures.findFirst(name);
  }

  async findTextures({ prefix }: { prefix: string }) {
    return Textures.findUsingPattern(`${prefix}*`);
  }

  async createNullInstance({ name }: { name: string }) : Promise<SceneObject>{
    return Scene.create(ObjectTypes.SCENE, { name }) as unknown as SceneObject;
  }

  async createCanvas({ name }: { name: string }): Promise<Canvas> {
    return Scene.create(ObjectTypes.CANVAS, { name }) as unknown as Canvas;
  }

  async createCanvasInFocalDistance({ name }: { name: string }): Promise<Canvas> {
    const canvas = await Scene.create(ObjectTypes.CANVAS, { name }) as unknown as Canvas;
    
    this.fD.addChild(canvas);

    canvas.setMode(Scene.RenderMode.WORLD_SPACE);
    
    return canvas;
  }

  async createRectangleInstance({ name, width, height, hidden = false }: IRectangleAttributes): Promise<PlanarImage> {
    const attributes: IRectangleAttributes = { name };

    if (width) attributes.width = width;
    if (height) attributes.height = height;
    if (hidden) attributes.hidden = hidden;

    return Scene.create(ObjectTypes.PLANAR_IMAGE, attributes) as unknown as PlanarImage;
  }

  async createPlaneInstance({ name, width, height, hidden }: IPlaneAttrubutes) : Promise<Plane>{
    const attributes: IPlaneAttrubutes = { name: name ? name : `${ObjectTypes.PLANE}${(Math.random() * 1000).toString()}` };

    if (width) attributes.width = width;
    if (height) attributes.height = height;
    if (hidden) attributes.hidden = hidden;

    return Scene.create(ObjectTypes.PLANE, attributes) as unknown as Plane;
  }

  async createPlanes(number: number): Promise<SceneObjectBase[]> {
    const counter = this.util.createLoopCount(number);
    
    return Promise.all(
      counter.map((el) => {
        return this.createPlaneInstance({ name: `plane${el}` });
      }),
    );
  };

  async createMaterialInstance<T>({
    name,
    type = MaterialTypes.DEFAULT,
    blendMode = 'ALPHA',
    diffuse,
    diffuseColorFactor,
    opacity,
  }: IMaterialAttributes) : Promise<MaterialBase>{
    const attributes: IMaterialAttributes = { name: name ? name : `${type}${(Math.random() * 1000).toString()}` };

    if (blendMode) attributes.blendMode = blendMode;
    if (diffuse) attributes.diffuse = diffuse;
    if (opacity) attributes.opacity = opacity;
    if (diffuseColorFactor) attributes.diffuseColorFactor = diffuseColorFactor;

    return Materials.create(type, attributes);
  }

  async createMaterials(number: number): Promise<MaterialBase[]> {
    const counter = this.util.createLoopCount(number);
    
    return Promise.all(
      counter.map((el) => {
        return this.createMaterialInstance({ name: `material${el}` });
      }),
    );
  }

  createShadesForTexture({ tex, color }: { tex: TextureBase; color: Vec4Signal | ShaderSignal }) {
    return Shaders.blend(tex.signal, color, { mode: Shaders.BlendMode.PLUSDARKER })
  }

  createShadesForTextureRG({ tex }: { tex: TextureBase }) {
   const val = this.anime.lightUpRedGreenAnimation();

    return Shaders.blend(tex.signal, val, { mode: Shaders.BlendMode.PLUSDARKER })
  }

  async createColoredMaterial({ tex, color }: { tex: TextureBase, color: Vec4Signal | ShaderSignal}): Promise<MaterialBase> {
    const material = await this.createMaterialInstance({ name: 'coloredMaterial' });

    const coloredTexture = this.createShadesForTexture({ tex, color })
  
    material.setTextureSlot(Shaders.DefaultMaterialTextures.DIFFUSE, coloredTexture);
    
    return material;
  }

  async getCamera(): Promise<Camera> {
    return Scene.root.findFirst('Camera') as unknown as Camera
  }

  async createRectWithCanvas (): Promise<PlanarImage> {
    const [fD, camera, canv, rect] = await Promise.all([
      this.util.getFocalDistance(),
      this.getCamera(),
      this.createCanvas({ name: 'canv' }),
      this.createRectangleInstance({ name: 'rect' }),
    ]);

    canv.setMode(Scene.RenderMode.WORLD_SPACE)

    fD.addChild(canv);
    canv.addChild(rect);

    rect.width = camera.focalPlane.width;
    rect.height = camera.focalPlane.height;
    rect.horizontalAlignment = Scene.HorizontalAlignment.CENTER;
    rect.verticalAlignment = Scene.VerticalAlignment.CENTER;

    return rect;
  }
  
  async createRectAsChildOfCanvas ({ canvas }: { canvas: Canvas }): Promise<PlanarImage> {
    const [rect, camera] = await Promise.all([
      this.createRectangleInstance({ name: 'rect' }),
      this.getCamera(),
    ])
    
    const centeredRect = this.centerRect({ rect, camera })

    canvas.addChild(centeredRect);

    return centeredRect;
  }

  centerRect({ rect, camera }: { rect: PlanarImage; camera: Camera }): PlanarImage {    
    rect.width = camera.focalPlane.width;
    rect.height = camera.focalPlane.height;

    rect.horizontalAlignment = Scene.HorizontalAlignment.CENTER;
    rect.verticalAlignment = Scene.VerticalAlignment.CENTER;

    return rect;
  }

  async createRectWithCamTex ({ tex }: { tex: TextureBase }) {
    const [rect, matNew] = await Promise.all([
      this.createRectWithCanvas(),
      this.createMaterialInstance({ name: 'matNew' }),
    ]);

    matNew.setTextureSlot(Shaders.DefaultMaterialTextures.DIFFUSE, tex.signal);

    rect.material = matNew;
  }

  async giveRectTex ({ rect, tex }: { rect: PlanarImage; tex: ShaderSignal}) {
    const matTex = await this.createMaterialInstance({ name: 'mat_cam_tex' });

    matTex.setTextureSlot(Shaders.DefaultMaterialTextures.DIFFUSE, tex);

    rect.material = matTex;
  }

  async giveRectMat ({ rect, mat }: { rect: PlanarImage; mat: MaterialBase }) {
    rect.material = mat;
  }

  async giveRectPersonMats ({ rect }: { rect: PlanarImage }) {
    const mats = await this.findMaterials({ prefix: 'person' });

    rect.material = mats[1];
    
    let i = -2;
    
    TimeModule.setInterval(() => {
      i += 2;

      return rect.material = mats[i < 2 ? i : 2];
    }, 1000);
  }

  async animateRectColors({ rect, tex }: { rect: PlanarImage; tex: TextureBase }) {
    const color = this.anime.lightUpColorsAnimation({
      color1: [1, 0, 0, 1],
      color2: [0, 1, 0, 1],
    }); 

    // const color = this.anime.createRandomColors();

    const mat = await this.createColoredMaterial({ tex, color });
    
    rect.material = mat;

    return rect;
  }

  async createFaceMesh({ name }: { name: string }) {
    return Scene.create('FaceMesh', { name }) as unknown as FaceMesh;
  }

  async addMeshToParent({ meshesParent, newMesh }: { meshesParent: any; newMesh: FaceMesh }) {
    return meshesParent.addChild(newMesh);
  }

  assignTextureToMaterial({ texture, material }: { texture: TextureBase; material: MaterialBase }) {
    material.diffuse = texture;
  }

  addMaterialToObject({ object, material }: { object: any; material: MaterialBase }) {
    object.material = material;
  }

  async destroyObject(object: any) {
    return Scene.destroy(object);
  }

  async destroyMaterial(material: any) {
    return Materials.destroy(material);
  }

  async setupTaleItems({
    taleGroup, taleArray, windowMat,
  }: {
    taleGroup: SceneObject;
    taleArray: Plane[];
    windowMat: MaterialBase;
  }) {
    taleArray.map((plane) => plane.material = windowMat);

    const sortedArray = this.util.sortPlaneArrayByName(taleArray);

    sortedArray[taleArray.length - 1].x = Reactive.mul(this.faceTransform.position.x, 2)
    sortedArray[taleArray.length - 1].y = Reactive.mul(this.faceTransform.position.y, 2);

    sortedArray.map((plane: Plane, i) => {
      if (i === sortedArray.length - 1) return;
  
      plane.x = sortedArray[i + 1].x.expSmooth(600);
      plane.y = sortedArray[i + 1].y.expSmooth(600);
    })
      
    this.fD.addChild(taleGroup);
    
    sortedArray.map((plane) => taleGroup.addChild(plane));

    return { taleGroup, taleArray };
  }

  async setupTraceItems({
    traceGroup,
    traceArray,
    windowMat,
  }: {
    traceGroup: SceneObject;
    traceArray: Plane[];
    windowMat: MaterialBase;
  }) {
    this.fD.addChild(traceGroup);

    traceArray.map((plane: Plane) => {
      traceGroup.addChild(plane);
      plane.material = windowMat;

      plane.y = Reactive.val(2);
      plane.x = Reactive.val(2);

      plane.hidden = Reactive.val(true);
    })
  
    return { traceGroup, traceArray };
  }

  async setupWinampItems({
    winampGroup, winampArray, windowMat,
  }: {
    winampGroup: SceneObject;
    winampArray: Plane[];
    windowMat: MaterialBase;
  }) {
    this.fD.addChild(winampGroup);

    winampArray.map((plane: Plane) => {
      winampGroup.addChild(plane);

      plane.material = windowMat;

      plane.y = Reactive.val(2);
      plane.x = Reactive.val(2);

      plane.hidden = Reactive.val(true);
    })
  
    return  { winampGroup, winampArray };
  }

  async setupPaintItems({
    windowMat, planePaint, planeBucket, planeBucketMat, bucketIcon
  }: {
    planePaint: Plane;
    planeBucket: Plane;
    planeBucketMat: MaterialBase;
    windowMat: MaterialBase;
    bucketIcon: TextureBase;
  }) {
    this.fD.addChild(planePaint);
    this.fD.addChild(planeBucket);

    planePaint.material = windowMat;

    planePaint.x = this.faceTransform.position.x;
    planePaint.y = this.faceTransform.position.y;

    planeBucketMat.diffuse = bucketIcon;
    planeBucket.material = planeBucketMat;

    const animation1 = this.anime.simpleMovement({ loopCount: Infinity, ms: 300 });
    const animation2 = this.anime.simpleMovement({ loopCount: Infinity, ms: 400 });

    planeBucket.x = planePaint.boundingBox.min.x.add(0.01).add(animation1)
    planeBucket.y = planePaint.boundingBox.min.y.add(0.01).add(animation2);

    return { planePaint, planeBucket, planeBucketMat, bucketIcon }
  }

  async destroyAllItems(necessities: any) {
    const {
      bgMats,
      windowMats,
      taleArray,
      taleGroup,
      traceArray,
      traceGroup,
      winampGroup,
      winampArray,
      planePaint,
      planeBucket,
      planeBucketMat,
    } = necessities;

    return Promise.all([
      Promise.all([
        // ...personMats,
        ...windowMats,
        ...bgMats,
        planeBucketMat,
      ].map(async (mat: MaterialBase) => this.destroyMaterial(mat))),
      Promise.all([
        ...taleArray,
        ...traceArray,
        ...winampArray,
        planePaint,
        planeBucket,
        winampGroup,
        traceGroup,
        taleGroup,
        ].map(async (plane: Plane) => this.destroyObject(plane)),
      ),
    ]);
  }
  
  async initiateCanvasAndRects({
    canvas,
    bgMats,
    bgRect,
    personRect,
    camera,
  }: {
    canvas: Canvas;
    bgRect: PlanarImage;
    camera: Camera;
    personRect: PlanarImage;
    bgMats: MaterialBase[],
  }) {
    canvas.setMode(Scene.RenderMode.WORLD_SPACE);

    this.centerRect({ rect: bgRect, camera });
    this.centerRect({ rect: personRect, camera });

    canvas.addChild(bgRect);
    canvas.addChild(personRect);

    bgRect.material = bgMats[2]
    personRect.hidden = Reactive.val(true);
  }

  
  // personMats,
  // bgMats,
  // canvas,
  // bgRect,
  // personRect,
  // camera,
  // bucketIcon,

  async obtainRequirements() {
  //  const [
    // personMats,
    // bgMats,
    // canvas,
    // bgRect,
    // personRect,
    // camera,
    // bucketIcon,
  //  ] = await
   return Promise.all([
      this.findMaterials({ prefix: 'person' }),
      this.findMaterials({ prefix: 'bg' }),
      this.createCanvasInFocalDistance({ name: 'canvas1' }),
      this.createRectangleInstance({ name: 'bg' }),
      this.createRectangleInstance({ name: 'person' }),
      this.getCamera(),
      this.findTexture({ name: 'bucketIcon' }),
    ]);

    // return {
    //   bgMats,
    //   canvas,
    //   bgRect,
    //   personRect,
    //   camera,
    //   bucketIcon,
    // };
  }

  async obtainNecessities ({
    bgMats,
    canvas,
    bgRect,
    personRect,
    camera,
    bucketIcon,
  }: {
    bgMats: MaterialBase[];
    canvas: Canvas;
    bgRect: PlanarImage;
    personRect: PlanarImage;
    camera: Camera;
    bucketIcon: TextureBase;
  }) {
    const winampCounter = this.util.createLoopCount(10);
    const tracerCounter = this.util.createLoopCount(50);

    const [
      windowMats,
      screenTexs,
      planePaint,
      planeBucket,
      planeBucketMat,
      winampGroup,
      winampArray,
      traceGroup,
      traceArray,
      taleGroup,
      taleArray,
    ] = await Promise.all([
      this.findMaterials({ prefix: 'window' }),
      this.findTextures({ prefix: 'screen' }),
      this.createPlaneInstance({ name: 'planePaint', height: 0.15, hidden: Reactive.val(true) }),
      this.createPlaneInstance({ name: 'planeBucket', width: 0.02, height: 0.02, hidden: Reactive.val(true) }),
      this.createMaterialInstance({ name: 'paintPlaneMat' }),
      this.createNullInstance({ name: 'winampGroup' }),
      Promise.all(
        winampCounter.map(async (item) => {
          return this.createPlaneInstance({
            name: `winamp${item}`,
            height: 0.2,
            hidden: Reactive.val(true),
          });
        })
      ),
      this.createNullInstance({ name: 'traceGroup' }),
      Promise.all(
        tracerCounter.map(async (item) => {
          return this.createPlaneInstance({
            name: `trace${item}`,
            hidden: Reactive.val(true),
          });
        })
      ),
      this.createNullInstance({ name: 'taleGroup' }),
      Promise.all(
        [1,2,3,4,5].map(async (item) => {
          return this.createPlaneInstance({
            name: `tale${item}`,
            hidden: Reactive.val(true),
          });
        }),
      ),
    ]);
  
    await this.setupTaleItems({ windowMat: windowMats[0], taleGroup, taleArray});

    await this.setupTraceItems({ windowMat: windowMats[1], traceGroup, traceArray });

    await this.setupWinampItems({ windowMat: windowMats[3], winampGroup, winampArray });

    await this.setupPaintItems({ windowMat: windowMats[2], planePaint, planeBucket, planeBucketMat, bucketIcon });

    await this.initiateCanvasAndRects({ camera, canvas, bgMats, bgRect, personRect });

    return {
      windowMats,
      screenTexs,
      taleArray,
      taleGroup,
      traceArray,
      traceGroup,
      winampGroup,
      winampArray,
      planePaint,
      planeBucket,
      planeBucketMat,
    };
  }
}

// canvas.mode = Scene.RenderMode.WORLD_SPACE;
// In WORLD_SPACE Canvas behaves as regular 3D object

// Materials.create("DefaultMaterial", {
//   "name": "Default Material",
//   "blendMode": "ALPHA",
//   "opacity": 1.0,
//   "diffuse": textureOne,
// }),

// Materials.create("BlendedMaterial", {
//   "name": "Blended Material",
//   "opacity": 0.8,
//   "diffuse": textureTwo,
// }),
// ]);
// dynamicPlane.material = defaultMaterial;

 // Destroy the plane and material when the plane is tapped
//  TouchGestures.onTap(dynamicPlane).subscribe(() => {
//   Scene.destroy(dynamicPlane);
//   Materials.destroy(dynamicMaterial);
// });

  // Clone the existing material from the Assets panel and alter its initiation state, including specifying a new diffuse texture.
//   Materials.clone(existingMaterial, {
//     "name": "Cloned Material",
//     "blendMode": "ALPHA",
//     "opacity": 0.8,
//     "diffuse": newTexture,
//     "diffuseColorFactor": Reactive.RGBA(255,0,0,1),
// }),


// focalDistance.addChild(dynamicCanvas);
// dynamicCanvas.addChild(dynamicRectangle);
// focalDistance.addChild(dynamicAmbientLight);
// focalDistance.addChild(dynamicDirectionalLight);
// focalDistance.addChild(dynamicPointLight);
// focalDistance.addChild(dynamicSpotLight);
// focalDistance.addChild(dynamicParticleSystem);
// focalDistance.addChild(dynamicNull);