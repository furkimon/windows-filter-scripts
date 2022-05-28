import Scene from 'Scene';
import Animation from 'Animation';
import Diagnostics from 'Diagnostics';
import Shaders from 'Shaders';
import Reactive from 'Reactive';

export default class AnimationCenter {
  createNumberAnimation () {
    const timeDriver = Animation.timeDriver({
      durationMilliseconds: 400,
      loopCount: 1000,
    });

    timeDriver.start();

    const sampler = Animation.samplers.linear(0, 1);

    return Animation.animate(timeDriver, sampler);
  }

  createRandomColors(): ShaderSignal {
    const timeDriver1 = Animation.timeDriver({
      durationMilliseconds: 300,
      loopCount: 1000,
    });

    const timeDriver2 = Animation.timeDriver({
      durationMilliseconds: 200,
      loopCount: 1000,
    });

    const timeDriver3 = Animation.timeDriver({
      durationMilliseconds: 400,
      loopCount: 1000,
    });

    timeDriver1.start();
    timeDriver2.start();
    timeDriver3.start();

    const sampler1 = Animation.samplers.linear([1, 0, 0, 1], [0, 1, 1, 1]) as ArrayOfScalarSamplers;
    const sampler2 = Animation.samplers.linear([0, 1, 0, 1], [0, 0, 1, 1]) as ArrayOfScalarSamplers;
    const sampler3 = Animation.samplers.linear([1, 0, 0, 1], [1, 0, 1, 1]) as ArrayOfScalarSamplers;

    const animation1 = Animation.animate(timeDriver1, sampler1);
    const animation2 = Animation.animate(timeDriver2, sampler2);
    const animation3 = Animation.animate(timeDriver3, sampler3);

    const color1 = Reactive.pack4(animation1[0], animation1[1], animation1[2], animation1[3])
    const color2 = Reactive.pack4(animation2[0], animation2[1], animation2[2], animation2[3])
    const color3 = Reactive.pack4(animation3[0], animation3[1], animation3[2], animation3[3])

    const blend1 = Shaders.blend(color1, color2, { mode: Shaders.BlendMode.NORMAL });
    const blend2 = Shaders.blend(blend1, color3, { mode: Shaders.BlendMode.NORMAL });

    return blend2;
  }

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

  lightUpColorsAnimation({ color1, color2 }: { color1: number[]; color2: number[] }): Vec4Signal {
    const timeDriver = Animation.timeDriver({
      durationMilliseconds: 100,
      loopCount: 1000,
    });
    
    const sampler = Animation.samplers.linear(color1, color2) as ArrayOfScalarSamplers;
    
    timeDriver.start();

    const animation = Animation.animate(timeDriver, sampler) as unknown as ArrayOfScalarSignals;

    return Reactive.pack4(animation[0], animation[1], animation[2], animation[3])
  }
}