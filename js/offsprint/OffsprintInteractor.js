(function(interactors)
{
    function OffsprintInteractor()
    {
        
    }

    Object.defineProperties(OffsprintInteractor.prototype,
    {
        getIssue : {
            value: function(key, listener)
            {
				$.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/issue/" + key + "",
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
        },
        getIssues : {
            value: function(issues, listener, startAt = 0)
            {
                var self = this;
                
                var pagination = 1000;
                
                $.ajax
				({
					type: "GET",
                    dataType: 'json',
                    contentType: 'application/json',
					url: credentials.server + "/rest/api/2/search/?jql=parent in (" + issues.toString() + ")+order+by+updated&fields=assignee,status,parent,summary,issuetype,timetracking&maxResults=" + pagination + "&startAt=" + startAt,
                    beforeSend: function(xhr) { 
						xhr.setRequestHeader("Authorization", "Basic " + credentials.token);
                        $.xhrPool.push(xhr);
					},
					success: function (json)
					{
                        listener.onSuccess(json);
                        
                        if(json.startAt + pagination <= json.total)
                        {
                            self.getIssues(issues, listener, json.startAt + pagination);
                        }
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

    interactors.OffsprintInteractor = OffsprintInteractor;
})(viewer.interactors);