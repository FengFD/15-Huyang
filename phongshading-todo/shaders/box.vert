#version 300 es
precision highp float;

// 顶点输入属性
in vec4 vPosition;   // 顶点位置
in vec4 vNormal;     // 顶点法向量
in vec2 vTexCoord;   // 顶点纹理坐标

// 输出到片段着色器的变量
out vec3 fragNormal;   // 世界空间法向量
out vec3 fragPosition; // 世界空间顶点位置
out vec2 fragTexCoord; // 纹理坐标
out vec4 lightSpacePos;// 光源空间顶点位置（用于阴影计算）

// 变换矩阵（由JS传入）
uniform mat4 u_ModelMatrix;     // 模型矩阵
uniform mat4 u_ViewMatrix;      // 视图矩阵
uniform mat4 u_ProjectionMatrix;// 投影矩阵
uniform mat4 u_LightSpaceMatrix;// 光源空间变换矩阵（投影*视图）

void main() {
    // 计算世界空间顶点位置
    fragPosition = vec3(u_ModelMatrix * vPosition);
    // 计算世界空间法向量（考虑模型变换的旋转缩放）
    fragNormal = vec3(u_ModelMatrix * vNormal);
    // 传递纹理坐标
    fragTexCoord = vTexCoord;
    // 计算光源空间位置（用于阴影图采样）
    lightSpacePos = u_LightSpaceMatrix * vec4(fragPosition, 1.0);
    
    // 计算最终裁剪空间位置
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * vec4(fragPosition, 1.0);
}