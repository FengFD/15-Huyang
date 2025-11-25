#version 300 es
precision highp float;

// 顶点着色器传入的变量
in vec3 fragNormal;    // 世界空间法向量
in vec3 fragPosition;  // 世界空间位置
in vec2 fragTexCoord;  // 纹理坐标
in vec4 lightSpacePos; // 光源空间位置

// 输出最终颜色
out vec4 fragColor;

// 纹理采样器
uniform sampler2D diffuseTexture; // 漫反射纹理
uniform sampler2D depthTexture;   // 阴影图深度纹理

// 光照参数
uniform vec4 u_lightPosition; // 光源位置（w=1为点光源，w=0为方向光源）
uniform vec3 lightColor;      // 光源颜色
uniform vec3 viewPos;         // 观察者位置

// 材质参数
uniform float ambientStrength;  // 环境光强度
uniform float diffuseStrength;  // 漫反射强度
uniform float specularStrength; // 镜面反射强度
uniform float shininess;        // 高光系数

/* 阴影计算，返回1表示在阴影中，0表示不在（优化平行光源适配） */
float calculateShadow() {
    // 1. 将光源空间位置转换为NDC（标准化设备坐标）
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
    // 2. 将NDC坐标[-1,1]映射到纹理坐标[0,1]
    projCoords = projCoords * 0.5 + 0.5;
    
    // 3. 从阴影图中获取最近点的深度
    float closestDepth = texture(depthTexture, projCoords.xy).r;
    // 4. 当前片段在光源空间的深度
    float currentDepth = projCoords.z;
    
    // 5. 解决阴影 acne 问题（根据光源类型动态调整偏移）
    float bias;
    if (u_lightPosition.w == 0.0) {
        // 平行光源：光线角度更平缓，需要更大的偏移避免条纹
        bias = 0.01;
    } else {
        // 点光源：保持较小偏移
        bias = 0.005;
    }
    
    // 6. 判断是否在阴影中（当前深度 > 最近深度则在阴影中）
    float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;
    
    // 7. 超出光源视锥体范围的点不计算阴影
    if (projCoords.z > 1.0) {
        shadow = 0.0;
    }
    
    return shadow;
}

void main() {
    /* 纹理采样 */
    vec3 texColor = texture(diffuseTexture, fragTexCoord).rgb;
    
    /* 法向量标准化 */
    vec3 normal = normalize(fragNormal);
    
    /* 计算光源方向（修正平行光源逻辑） */
    vec3 lightDir;
    if (u_lightPosition.w == 1.0) {
        // 点光源：从顶点指向光源（正确）
        lightDir = normalize(u_lightPosition.xyz - fragPosition);
    } else {
        // 平行光源：方向向量直接使用u_lightPosition.xyz（已归一化）
        // 注意：u_lightPosition.xyz应表示光线传播方向（如[1,-1,-1]表示从左上后方照射）
        lightDir = normalize(u_lightPosition.xyz);
    }
    
    /* Phong光照模型计算 */
    // 1. 环境光
    vec3 ambient = ambientStrength * lightColor;
    
    // 2. 漫反射
    float diff = max(dot(normal, lightDir), 0.0); // 确保夹角≤90度
    vec3 diffuse = diffuseStrength * diff * lightColor;
    
    // 3. 镜面反射
    vec3 viewDir = normalize(viewPos - fragPosition); // 视线方向
    vec3 reflectDir = reflect(-lightDir, normal);     // 反射光方向
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess); // 高光幂次
    vec3 specular = specularStrength * spec * lightColor;
    
    /* 阴影计算 */
    float shadow = calculateShadow();
    
    /* 最终颜色合成 */
    // 阴影仅影响漫反射和镜面反射，不影响环境光
    vec3 result = texColor * (ambient + (1.0 - shadow) * (diffuse + specular));
    fragColor = vec4(result, 1.0);
}