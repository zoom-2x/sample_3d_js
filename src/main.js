var scenes = [
    "rasterization/index.html",
    "raycaster/index.html",
    "voxels/index.html",
    "wireframe/index.html"
];

$("#menu-panel").on("click", "#run-button", function(e)
{
    var scene_index = $("#scene-select").val();

    if (scene_index < 0 || scene_index >= scenes.length)
        scene_index = 0;

    window.location.href = scenes[scene_index];
});
