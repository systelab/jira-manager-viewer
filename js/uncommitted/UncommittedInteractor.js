(function(interactors)
{
    function UncommittedInteractor()
    {
        
    }

    Object.defineProperties(UncommittedInteractor.prototype,
    {
        load : {
            value: function(listener)
            {
				$.ajax
				({
					type: "GET",
					url: "/data/uncommitted.json",
					dataType: 'json',
                    contentType: 'application/json',
					success: function (json)
					{
						listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
                        if(jqxhr.status == 404)
                        {
                            listener.onSuccess({});
                        }
                        else
                        {
                            listener.onError(jqxhr);
                        }
					}
				});
            },
            enumerable: false
        },
        save : {
            value: function(data, listener)
            {
				$.ajax
				({
					type: "POST",
					url: "/data/uncommitted.json",
					data: JSON.stringify(data),
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
        },
        getIssue : {
            value: function(key, listener)
            {
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/issue/" + key + "?fields=parent,summary,issuetype",
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
					},
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

    interactors.UncommittedInteractor = UncommittedInteractor;
})(viewer.interactors);