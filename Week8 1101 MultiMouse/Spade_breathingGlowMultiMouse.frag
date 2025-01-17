// Author:Chen Tzu Yin
// Title:Spade Glow MultiMouse

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

float glow(float d, float str, float thickness){
    return thickness / pow(d, str);
}

vec2 hash2( vec2 x )            //亂數範圍 [-1,1]
{
    const vec2 k = vec2( 0.3183099, 0.3678794 );
    x = x*k + k.yx;
    return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
}
float gnoise( in vec2 p )       //亂數範圍 [-1,1]
{
    vec2 i = floor( p );
    vec2 f = fract( p );
    
    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( hash2( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                            dot( hash2( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                         mix( dot( hash2( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                            dot( hash2( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*gnoise( uv ); uv = m*uv;          
    f += 0.2500*gnoise( uv ); uv = m*uv;
    f += 0.1250*gnoise( uv ); uv = m*uv;
    f += 0.0625*gnoise( uv ); uv = m*uv;
    return f;
}

//Gradient Noise 3D
vec3 hash( vec3 p ) // replace this by something better
{
    p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
              dot(p,vec3(269.5,183.3,246.1)),
              dot(p,vec3(113.5,271.9,124.6)));

    return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec3 p )
{
    vec3 i = floor( p );
    vec3 f = fract( p );
    
    vec3 u = f*f*(3.0-2.0*f);

    return mix( mix( mix( dot( hash( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                          dot( hash( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                          dot( hash( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
                mix( mix( dot( hash( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                          dot( hash( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                     mix( dot( hash( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                          dot( hash( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

float M_SQRT_2 = 1.41421356237;
float spade(vec2 P, float size)
{
// Reversed heart (diamond + 2 circles)
float s= size * 0.85 / 3.5;
float x = M_SQRT_2/2.0 * (P.x + P.y) + 0.4*s;
float y = M_SQRT_2/2.0 * (P.x - P.y) - 0.4*s;
float r1 = max(abs(x),abs(y)) - s;
float r2 = length(P - M_SQRT_2/2.0*vec2(+1.0,+0.2)*s) - s; float r3 = length(P - M_SQRT_2/2.0*vec2(-1.0,+0.2)*s) - s; float r4 = min(min(r1,r2),r3);

// Root (2 circles and 2 half-planes) 
    const vec2 c1 = vec2(+0.65, 0.125); const vec2 c2 = vec2(-0.65, 0.125); float r5 = length(P-c1*size) - size/1.6; float r6 = length(P-c2*size) - size/1.6; float r7 = P.y - 0.5*size;
   float r8 = 0.1*size - P.y;
   float r9 = max(-min(r5,r6), max(r7,r8));
return min(r4,r9);
}

float cross(vec2 P, float size)
{
    float x = M_SQRT_2/2.0 * (P.x - P.y);
    float y = M_SQRT_2/2.0 * (P.x + P.y);
    float r1 = max(abs(x - size/3.0), abs(x + size/3.0));
    float r2 = max(abs(y - size/3.0), abs(y + size/3.0));
    float r3 = max(abs(x), abs(y));
    return max(min(r1,r2),r3) - size/2.0;
}

float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist=length(uv-mouse);
    return 1.2-smoothstep(size*0.02, size, dist);  //size
    //return pow(dist, 0.5);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    vec2 mouse=u_mouse/u_resolution.xy;
    mouse.x*= u_resolution.x/u_resolution.y;
    mouse=mouse*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //互動陰晴圓缺
    float interact=1.024-mouseEffect(uv,mouse,0.718);
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.4+0.1;

    //定義圓環
    float result;
    for(float index=0.0;index<18.0;++index)
    {
    //float index=0.0;
    //float noise_position= smoothstep(-0.2, 0., -uv.y+-0.036);
    
    //model spade
    vec2 uv_flip= vec2(uv.x, -uv.y);
    float noise_position= interact;
    float noisespade = noise(vec3(2.452*uv,index+u_time*0.980))*0.216*noise_position;
    float spade_dist= abs(spade(uv_flip,1.072)+noisespade);
        
    //model cross
    float cross_position= interact;
    float cross_noise = noise(vec3(2.50*uv,index+u_time*0.204))*0.312*cross_position;
    float cross_dist= abs(cross(uv,1.560)+cross_noise);
        
    //動態呼吸
    //float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
    float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.08*breathing+0.2);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.0*breathing+0.01);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(cross_dist, strength, thickness);
    result+=glow_circle;
    }
    gl_FragColor = vec4((vec3(result+fog)),1.0);
    //gl_FragColor = vec4(vec3(circle_dist),1.0); 
    //gl_FragColor = vec4((vec3(result)+fog)*dir*vec3(0.909,0.990,1.000)*0.884,1.0);
}
