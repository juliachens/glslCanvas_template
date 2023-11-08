// Author: Chen Tzu Yin
// Title: Week7 Homework

#ifdef GL_ES
precision mediump float;
#endif

//void BreathingRing();
//void Noise();

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
#define Use_Perlin
//#define Use_Value
float noise( in vec2 p )        //亂數範圍 [-1,1]
{
#ifdef Use_Perlin    
return gnoise(p);   //gradient noise
#elif defined Use_Value
return vnoise(p);       //value noise
#endif    
return 0.0;
}
float fbm(in vec2 uv)       //亂數範圍 [-1,1]
{
    float f;                                                //fbm - fractal noise (4 octaves)
    mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
    f   = 0.5000*noise( uv ); uv = m*uv;          
    f += 0.2500*noise( uv ); uv = m*uv;
    f += 0.1250*noise( uv ); uv = m*uv;
    f += 0.0625*noise( uv ); uv = m*uv;
    return f;
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

float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist=length(uv-mouse);
    return 1.2-smoothstep(size*1.9, size, dist);  //size //滑鼠的中心點
    //return pow(dist, 0.5);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    vec2 mouse=u_mouse/u_resolution.xy;
    mouse.x*= u_resolution.x/u_resolution.y;
    mouse=mouse*2.0-1.0;//[-1,1]
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //亂數作用雲霧
    float fog= fbm(0.880*uv+vec2(-0.132*u_time, -0.02*u_time))*0.816+0.044;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);                                //光環大小
    
    //float interact= mouseEffect(uv,mouse,0.388);
    
float result;
    for(int index=0; index<6; ++index)
{
        
    //model spade
    vec2 uv_flip= vec2(uv.x, -uv.y);
    //float noise_position= interact;
    float weight= smoothstep(0.056,-0.020,-uv.y);
        float freq= 4.0+ float(index)*-0.332; //第一次迴圈是8-8.1-8.2-......
    float noisespade = gnoise(uv_flip*freq+vec2(-0.1*u_time,-0.2*u_time))*-0.092*weight;//偏移加變形加權重
    float spade_dist= abs(spade(uv_flip,0.848)+noisespade);//加入偏移
    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.1*breathing+0.7);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.010);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(spade_dist, strength, thickness);          //"hear_dist"可以變換成各個模型
    result+= glow_circle; //'+'將每次的迴圈加入
}
    
    gl_FragColor = vec4((vec3(result)+fog)*dir*vec3(0.858,0.880,1.000)*0.5,1.0); //加上雲霧和調色
}
