(function(interactors)
{
    function WorklogInteractor()
    {
        
    }

    Object.defineProperties(WorklogInteractor.prototype,
    {
        getIssues : {
            value: function(projects, fromRaw, toRaw, listener, startAt = 0)
            {
                var self = this;
                
                var pagination = 100;
                
				var issueFunction = "worklogDate  >= \"" + fromRaw + "\" AND worklogDate <= \"" + toRaw + "\"";
				
                $.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/search/?jql=" + issueFunction + 
											  " and project in (" + projects.toString() + 
											  ")+order+by+updated&fields=worklog,project&maxResults=" + pagination + "&startAt=" + startAt,
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
                        listener.onSuccess(json);
                        
                        if(json.startAt + pagination <= json.total)
                        {
                            self.getIssues(projects, fromRaw, toRaw, listener, json.startAt + pagination);
                        }
					},
					error: function (jqxhr, textStatus, error)
					{
						if(textStatus != "abort")
                        {
                            listener.onError(jqxhr, textStatus, error);
                        }
					}
				});
            },
            enumerable: false
        },
        getProjects : {
            value: function(listener)
            {
                var self = this;
				
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/project",
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
                        listener.onSuccess(json);
					},
					error: function (jqxhr, textStatus, error)
					{
						if(textStatus != "abort")
                        {
                            listener.onError(jqxhr.responseJSON);
                        }
					}
				});
            },
            enumerable: false
        }
    });

    interactors.WorklogInteractor = WorklogInteractor;
})(viewer.interactors);