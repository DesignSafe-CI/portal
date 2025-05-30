from django.db import models

class PublicationSymlink(models.Model):
    accessor = models.CharField(max_length=512, primary_key=True)  # tapis://<system>/<path>
    link_type = models.CharField(max_length=4, choices=[('file', 'File'), ('dir', 'Directory')])

    def __str__(self):
        return f"{self.accessor} -> {self.link_type}"
