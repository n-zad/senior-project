# senior-project
Nickzad Bayati - Cal Poly Senior Project (from 1/9/23 to 6/16/23)

Live Streaming platform for music artists and bands

Thoughts on my progress as of 6/9/23:

- there were some weeks with a lack of good progress, mainly due to not spending enough time working on the project
    - that being said I think I have made decent progress overall

- are there things that I would do differently, definitely:
    - during the first few months I incorrectly assumed that my stream implementation worked fine
        - in reality when I wrote the API to serve chunks of the stream the process wasn't working
        - as a result I had to rewrite most of the code that dealt with recording chunks of the audio and encoding it for the database
    - in a similar vein my code was initially pretty messy, which also probably forced me to rewrite it down the road

- but there were also some good parts:
    - initially I was relying a bit too much on StackOverflow and ChatGPT
        - and I wasn't really understanding the process or how the code works
        - then I started reading over MDN documentation on the JS built-in libraries for recording audio
        - and getting a much better understanding of the overall process and the code I was writing
    - By taking on the project by myself, I got to experience multiple areas of web stack development

**Edit:**  
The MongoDB database I used has been disabled for now, this is intentional, although it means the deployed web app won't work anymore.  
When I resume working on this project the database will be restarted.
