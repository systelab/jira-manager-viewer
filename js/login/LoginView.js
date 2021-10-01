(function(views)
{
    var self;

    function LoginView(presenter)
    {
        this.presenter = presenter;
    }

    Object.defineProperties(LoginView.prototype,
    {
        init : {
            value: function()
            {
                var self = this;

                $(document).ready(function ()
                {             
                    $("#login dialog")[0].show();
                    $("#login form").submit(function(evt)
                    {
                        $("#login .progress").show();
                        $("#login .submit").hide();
                        self.presenter.login($("#login .server").val(), $("#login .user").val(), $("#login .password").val());
                        evt.preventDefault();
                    });
                    
                    componentHandler.upgradeAllRegistered();
                    
                    self.presenter.checkToken();
                    
                    $("#upgrade").click(function()
                    {
                        location.reload();
                    });
                    
                    $(document).on("upgrade", function (evt, version)
                    {
                        $("#upgrade").show();
                        $("#draggable-window").hide();
                        $("#upgrade").find("span").html(version);
                    });
                });
            },
            enumerable: false
        },
        load : {
            value: function(data)
            {
                $("#login").hide();
                $(".app-container").removeClass("hidden");
                $("#login .progress").hide();
                $("#login dialog")[0].close();
                
                $(document).trigger( "login", data);
            },
            enumerable: false
        },
        showError : {
            value: function(data)
            {
                $("#login .progress").hide();
                $("#login .submit").show();
                
                showError(data);
            },
            enumerable: false
        }
    });

    views.LoginView = LoginView;
})(viewer.views);