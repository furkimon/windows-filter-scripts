import Scene from 'Scene';
import Animation from 'Animation';
import Diagnostics from 'Diagnostics';
import Shaders from 'Shaders';
import Reactive from 'Reactive';

export default class AnimationCenter {
  lightUpRedGreenAnimation(): Vec4Signal {
    const timeDriver = Animation.timeDriver({
      durationMilliseconds: 100,
      loopCount: 1000,
    });
    
    const sampler = Animation.samplers.linear([1, 0, 0, 1], [0, 1, 0, 1]) as ArrayOfScalarSamplers;
    
    timeDriver.start();

    const animation = Animation.animate(timeDriver, sampler) as unknown as ArrayOfScalarSignals;

    return Reactive.pack4(animation[0], animation[1], animation[2], animation[3])
  }
}