// Author:Julia Chen
// Title:Week7 Classwork

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

float sdStar5(in vec2 p, in float r, in float rf)
{
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x,k1.y);
    p.x = abs(p.x);
    p -= 2.0*max(dot(k1,p),0.0)*k1;
    p -= 2.0*max(dot(k2,p),0.0)*k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
    float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
    return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}

float M_SQRT_2= 1.41421356237;
float heart(vec2 P, float size)
{
float x = M_SQRT_2/2.0 * (P.x - P.y);
   float y = M_SQRT_2/2.0 * (P.x + P.y);
   float r1 = max(abs(x),abs(y))-size/3.5;
   float r2 = length(P - M_SQRT_2/2.0*vec2(+1.0,-1.0)*size/3.5)
                - size/3.5;
   float r3 = length(P - M_SQRT_2/2.0*vec2(-1.0,-1.0)*size/3.5)
- size/3.5;
   return min(min(r1,r2),r3);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);                                //光環大小
    
    //model 1
    float model_dist=sdStar5(uv,0.376,0.388);
    
    //model heart
    vec2 uv_flip= vec2(uv.x, -uv.y);
    //float weight= smoothstep(-0.1,-0.2,-uv.y); //柔化 權重
    float weight= step(uv.y,0.116); //權重(控制哪些範圍沒有做用)
    float noise = gnoise(uv_flip*20.232)*0.084*weight;//偏移加變形加權重
    //float noise = gnoise(uv_flip*5.328)*0.196;//偏移加變形
    //float noise = gnoise(uv_flip)*0.196; //偏移
    float heart_dist= abs(heart(uv_flip,0.896)+noise);//加入偏移
   
    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.2*breathing+0.180);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.1*breathing+0.084);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(heart_dist, strength, thickness);          //"hear_dist"可以變換成各個模型
    gl_FragColor = vec4((vec3(glow_circle)+fog)*dir*vec3(1.0, 0.5, 0.25),1.0);
}

/*
加入迴圈
#ifdef GL_ES
precision mediump float;
#endif

void BreathingRing();
void Noise();

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

float sdStar5(in vec2 p, in float r, in float rf)
{
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x,k1.y);
    p.x = abs(p.x);
    p -= 2.0*max(dot(k1,p),0.0)*k1;
    p -= 2.0*max(dot(k2,p),0.0)*k2;
    p.x = abs(p.x);
    p.y -= r;
    vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1);
    float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
    return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
}

float M_SQRT_2= 1.41421356237;
float heart(vec2 P, float size)
{
float x = M_SQRT_2/2.0 * (P.x - P.y);
   float y = M_SQRT_2/2.0 * (P.x + P.y);
   float r1 = max(abs(x),abs(y))-size/3.5;
   float r2 = length(P - M_SQRT_2/2.0*vec2(+1.0,-1.0)*size/3.5)
                - size/3.5;
   float r3 = length(P - M_SQRT_2/2.0*vec2(-1.0,-1.0)*size/3.5)
- size/3.5;
   return min(min(r1,r2),r3);
}

float M_SQRT_2= 1.41421356237;
float spade(vec2 P, float size)
{
// Reversed heart (diamond + 2 circles)
float s= size * 0.85 / 3.5;
float x = M_SQRT_2/2.0 * (P.x + P.y) + 0.4*s;
float y = M_SQRT_2/2.0 * (P.x - P.y) - 0.4*s;
float r1 = max(abs(x),abs(y)) - s;
float r2 = length(P - M_SQRT_2/2.0*vec2(+1.0,+0.2)*s) - s; float r3 = length(P - M_SQRT_2/2.0*vec2(-1.0,+0.2)*s) - s; float r4 = min(min(r1,r2),r3);

// Root (2 circles and 2 half-planes) const vec2 c1 = vec2(+0.65, 0.125); const vec2 c2 = vec2(-0.65, 0.125); float r5 = length(P-c1*size) - size/1.6; float r6 = length(P-c2*size) - size/1.6; float r7 = P.y - 0.5*size;
   float r8 = 0.1*size - P.y;
   float r9 = max(-min(r5,r6), max(r7,r8));
return min(r4,r9);
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    uv.x *= u_resolution.x/u_resolution.y;
    uv= uv*2.0-1.0;
    
    //陰晴圓缺
    float pi=3.14159;
    float theta=2.0*pi*u_time/8.0;
    vec2 point=vec2(sin(theta), cos(theta));
    float dir= dot(point, (uv))+0.55;
    
    //亂數作用雲霧
    float fog= fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;

    //定義圓環
    float dist = length(uv);
    float circle_dist = abs(dist-0.512);                                //光環大小
    
    //model 1
    float model_dist=sdStar5(uv,0.376,0.388);
    
float result;
    for(int index=0; index<6; ++index)
{
    
    //model heart
    vec2 uv_flip= vec2(uv.x, -uv.y);
    float weight= smoothstep(-0.2,-0.116,-uv.y);
        float freq= 4.0+ float(index)*-0.332; //第一次迴圈是8-8.1-8.2-......
    float noise = gnoise(uv_flip*freq+vec2(-0.1*u_time,-0.2*u_time))*-0.332*weight;//偏移加變形加權重
    float heart_dist= abs(heart(uv_flip,0.8)+noise);//加入偏移
   
    
    //動態呼吸
    float breathing=sin(2.0*u_time/5.0*pi)*0.5+0.2;                     //option1
    //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;         //option2 錯誤
     //float breathing=(exp(sin(u_time/2.0*pi)) - 0.36787944)*0.42545906412;                //option2 正確
    float strength =(0.1*breathing+0.7);          //[0.2~0.3]         //光暈強度加上動態時間營造呼吸感
    float thickness=(0.01);          //[0.1~0.2]         //光環厚度 營造呼吸感
    float glow_circle = glow(heart_dist, strength, thickness);          //"hear_dist"可以變換成各個模型
    result+= glow_circle; //'+'將每次的迴圈加入
}
    
    gl_FragColor = vec4((vec3(result)+fog)*dir*vec3(1.0, 0.5, 0.25)*0.5,1.0); //加上雲霧和調色
}
*/
