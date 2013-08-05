# Backbone.Components

Shared repo for re-usable components built on top of Backbone JS

This repository was created to store and share components that I regularly build, and re-build, in Backbone JS driven web apps. 

PLEASE NOTE: I created this repository August 4th, 2013, so everything is very experimental at this point. I haven't even minified my code yet, or decided if I will continue to use straight HTML templates, so please use with caution. 

## Dependencies + Features

This repository relies on Backbone, Underscore, and JQuery - and includes re-usable views, such as forms, pagination, modals, etc. Components are buildt out of Backbone JS views, and Underscore templates. 

I also use Bootstrap for CSS in all of my default templates, but feel free to over-ride with your own custom templates as you initialize any of the enclosed views. 

I also include my custom BaseModel and BaseCollection whcih I inherit all of my models and collections from, and I hope to make this an optional feature of the library in the future. 

All constructors are attached to the global variable BBC (__short for Backbone.Components__)
