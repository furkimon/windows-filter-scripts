import Diagnostics from 'Diagnostics';
import FaceTracking from 'FaceTracking';
import Patches from 'Patches';
import Materials from 'Materials';
import Textures from 'Textures';
import Shaders from 'Shaders';
import Scene from 'Scene';
import CameraInfo from 'CameraInfo';
import Reactive from 'Reactive';
import Time from 'Time';

import Util from './util'
import PlaneActions from './planeActions';
import Factory from './factory';
import Flow from './flow';

const util = new Util();

const face: Face = FaceTracking.face(0);
const faceTransform: TransformSignal = face.cameraTransform;

(async () => {
  const focalDistance = await util.getFocalDistance();

  const factory = new Factory({ focalDistance });
  const planes = new PlaneActions({ focalDistance });
  const camTex = await Textures.findFirst('cameraTexture');

  const flow = new Flow({ focalDistance });

  await flow.startFlow();

  // const personTex = await Textures.findFirst('personTexture');

  // const canvas = await factory.createCanvasInFocalDistance({ name: 'canvas1' });
  
  // const bgRect = await factory.createRectAsChildOfCanvas({ canvas });
  // const mat = await Materials.findFirst('bgWall');
  // const personBlueMat = await Materials.findFirst('personBlue');

  // bgRect.material = mat;
  // const segmentRect = await factory.createRectAsChildOfCanvas({ canvas });
  
  // const wallTex = await factory.findTexture({ name: 'wall' });
  // const blueTex = await factory.findTexture({ name: 'screenBlue' });

  // const newTex = util.blendTextures({ src: blueTex.signal, dst: blueTex.signal });
  // await factory.giveRectTex({ rect: segmentRect, tex: newTex });
  // await factory.giveRectPersonMats({ rect: segmentRect });
  // await factory.animateRectColors({ rect, tex: camTex });
  
  // await factory.giveRectCamTex({ rect, tex: camTex });
  











  // Planes
  
  // const planeArray = await planes.createPlanesWithMaterials(5) as Plane[];

  // planes.givePlaneFacePositionMultiplied({
  //   plane: planeArray[planeArray.length - 1],
  //   faceTransform,
  // });

  // planes.followPlanesByPlanes({ planeArray: planeArray });

  // const planeGroup = await factory.createNullInstance({ name: 'planeGroup' });
    
  // focalDistance.addChild(planeGroup);
  
  // planeArray.map((plane) => planeGroup.addChild(plane));
})();
