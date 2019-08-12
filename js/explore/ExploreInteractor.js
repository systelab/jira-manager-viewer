(function(interactors)
{
    function ExploreInteractor()
    {
        
    }

    Object.defineProperties(ExploreInteractor.prototype,
    {
        getList : {
            value: function(listener)
            {
				$.ajax
				({
					type: "POST",
					url: "/data/token.json",
					data: JSON.stringify({server: server, token: btoa(user + ":" + password)}),
					dataType: 'json',
                    contentType: 'application/json',
					success: function (json)
					{
						listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
						listener.onError(jqxhr.responseJSON);
					}
				});
            },
            enumerable: false
        }
    });

    interactors.ExploreInteractor = ExploreInteractor;
})(viewer.interactors);