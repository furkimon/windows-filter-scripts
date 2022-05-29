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


export default class Factory {
  private util: Util;
  private anime: AnimationCenter;
  private fD: FocalDistance;

  constructor({ focalDistance }: { focalDistance?: FocalDistance }) {
    this.util = new Util();
    this.anime = new AnimationCenter();
    this.fD = focalDistance;
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
    await Scene.destroy(object);
  }

  async destroyMaterial(material: any) {
    await Materials.destroy(material);
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