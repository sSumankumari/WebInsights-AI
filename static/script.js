$(document).ready(function () {
    $("#fetchBtn").click(function () {
        let url = $("#urlInput").val().trim();
        
        if (url === "") {
            alert("⚠️ Please enter a valid URL.");
            return;
        }

        $("#loading").removeClass("d-none");
        $("#result").html("");

        $.ajax({
            url: "/analyze",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ url: url }),
            success: function (response) {
                $("#loading").addClass("d-none");
                $("#result").html(`<div class="alert alert-success">${response.summary}</div>`);
            },
            error: function () {
                $("#loading").addClass("d-none");
                $("#result").html(`<div class="alert alert-danger">❌ Failed to retrieve data.</div>`);
            }
        });
    });
});
