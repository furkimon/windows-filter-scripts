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

const util = new Util();

const face: Face = FaceTracking.face(0);
const faceTransform: TransformSignal = face.cameraTransform;

(async () => {
  const focalDistance = await util.getFocalDistance();

  const factory = new Factory({ focalDistance });
  const planes = new PlaneActions({ focalDistance });


  const camTex = await Textures.findFirst('cameraTexture');
  const personTex = await Textures.findFirst('personTexture');

  const canvas = await factory.createCanvasInFocalDistance({ name: 'canvas1' });
  
  const rect1 = await factory.createRectAsChildOfCanvas({ canvas });
  const rect2 = await factory.createRectAsChildOfCanvas({ canvas });
  
  // const wallTex = await factory.findTexture({ name: 'wall' });
  // const blueTex = await factory.findTexture({ name: 'blue' });

  await factory.giveRectCamTex({ rect: rect1, camTex });
  await factory.giveRectPersonMats({ rect: rect2 });
  // await factory.animateRectColors({ rect, tex: camTex });
  
  // await factory.giveRectCamTex({ rect, tex: camTex });
  











  // Planes
  
  const planeArray = await planes.createPlanesWithMaterials(5) as Plane[];

  planes.givePlaneFacePositionMultiplied({
    plane: planeArray[planeArray.length - 1],
    faceTransform,
  });

  planes.followPlanesByPlanes({ planeArray: planeArray });

  const planeGroup = await factory.createNullInstance({ name: 'planeGroup' });
    
  focalDistance.addChild(planeGroup);
  
  planeArray.map((plane) => planeGroup.addChild(plane));
})();
